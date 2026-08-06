-- Replace the versioned editorial/CMS schema with the smaller operational
-- schema used by the app. Existing current content, tags, linked sources,
-- reviews and delivery snapshots are preserved during the migration.

CREATE TABLE "contents" (
    "id" UUID NOT NULL,
    "key" VARCHAR(150) NOT NULL,
    "text" TEXT NOT NULL,
    "format" VARCHAR(50) NOT NULL DEFAULT 'prose',
    "language_code" VARCHAR(10) NOT NULL DEFAULT 'vi',
    "status" VARCHAR(30) NOT NULL DEFAULT 'draft',
    "origin" VARCHAR(30) NOT NULL DEFAULT 'unknown',
    "rights" VARCHAR(30) NOT NULL DEFAULT 'unknown',
    "author_user_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "published_at" TIMESTAMPTZ(6),
    "archived_at" TIMESTAMPTZ(6),

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

WITH candidates AS (
    SELECT
        ci.*,
        cv.text,
        cv.analysis,
        cv.created_at AS version_created_at,
        cv.character_count,
        cv.word_count,
        cv.line_count,
        COALESCE(NULLIF(cv.analysis->>'datasetContentKey', ''), ci.id::text) AS proposed_key
    FROM "content_items" ci
    LEFT JOIN "content_versions" cv ON cv.id = ci.current_version_id
), keyed AS (
    SELECT
        candidates.*,
        CASE
            WHEN COUNT(*) OVER (PARTITION BY proposed_key) > 1
                THEN proposed_key || ':' || id::text
            ELSE proposed_key
        END AS stable_key
    FROM candidates
)
INSERT INTO "contents" (
    "id", "key", "text", "format", "language_code", "status", "origin",
    "rights", "author_user_id", "metadata", "created_at", "updated_at",
    "published_at", "archived_at"
)
SELECT
    id,
    stable_key,
    COALESCE(text, ''),
    content_type::text,
    language_code,
    CASE
        WHEN status::text = 'published' AND publishable THEN 'published'
        WHEN status::text IN ('archived', 'rejected') THEN 'archived'
        ELSE 'draft'
    END,
    origin_type::text,
    rights_status::text,
    author_user_id,
    COALESCE(analysis, '{}'::jsonb) || jsonb_build_object(
        'legacy', jsonb_strip_nulls(jsonb_build_object(
            'contentStatus', status::text,
            'publishable', publishable,
            'sensitiveLevel', sensitive_level,
            'characterCount', character_count,
            'wordCount', word_count,
            'lineCount', line_count
        ))
    ),
    COALESCE(version_created_at, created_at),
    updated_at,
    published_at,
    archived_at
FROM keyed;

CREATE UNIQUE INDEX "contents_key_key" ON "contents"("key");
CREATE INDEX "contents_status_format_idx" ON "contents"("status", "format");
CREATE INDEX "contents_published_at_idx" ON "contents"("published_at");

ALTER TABLE "contents"
    ADD CONSTRAINT "contents_author_user_id_fkey"
    FOREIGN KEY ("author_user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "category" VARCHAR(50) NOT NULL DEFAULT 'topic',
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

INSERT INTO "tags" ("id", "category", "slug", "name", "created_at")
SELECT id, term_type::text, code, label, created_at
FROM "taxonomy_terms";

CREATE UNIQUE INDEX "tags_category_slug_key" ON "tags"("category", "slug");

CREATE TABLE "content_tags" (
    "content_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "content_tags_pkey" PRIMARY KEY ("content_id", "tag_id")
);

INSERT INTO "content_tags" ("content_id", "tag_id")
SELECT ci.id, cvt.term_id
FROM "content_items" ci
JOIN "content_version_terms" cvt ON cvt.content_version_id = ci.current_version_id
ON CONFLICT DO NOTHING;

CREATE INDEX "content_tags_tag_id_content_id_idx" ON "content_tags"("tag_id", "content_id");

ALTER TABLE "content_tags"
    ADD CONSTRAINT "content_tags_content_id_fkey"
    FOREIGN KEY ("content_id") REFERENCES "contents"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_tags"
    ADD CONSTRAINT "content_tags_tag_id_fkey"
    FOREIGN KEY ("tag_id") REFERENCES "tags"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Context rules become metadata. New operational targeting uses ordinary tags.
UPDATE "contents" c
SET "metadata" = c."metadata" || jsonb_build_object('contextRules', rules.value)
FROM (
    SELECT cv.content_id, jsonb_agg(jsonb_build_object(
        'dimension', ccr.dimension::text,
        'match', ccr.match_type::text,
        'value', ccr.value,
        'weight', ccr.weight
    ) ORDER BY ccr.created_at) AS value
    FROM "content_context_rules" ccr
    JOIN "content_versions" cv ON cv.id = ccr.content_version_id
    JOIN "content_items" ci ON ci.id = cv.content_id AND ci.current_version_id = cv.id
    GROUP BY cv.content_id
) rules
WHERE c.id = rules.content_id;

-- Preserve editorial decisions without keeping a review-history subsystem.
UPDATE "contents" c
SET "metadata" = c."metadata" || jsonb_build_object('reviews', reviews.value)
FROM (
    SELECT cv.content_id, jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'reviewerType', cr.reviewer_type::text,
        'evaluatorId', cr.evaluator_id,
        'decision', cr.decision::text,
        'scores', cr.scores,
        'reasons', cr.reasons,
        'note', cr.note,
        'createdAt', cr.created_at
    )) ORDER BY cr.created_at) AS value
    FROM "content_reviews" cr
    JOIN "content_versions" cv ON cv.id = cr.content_version_id
    JOIN "content_items" ci ON ci.id = cv.content_id AND ci.current_version_id = cv.id
    GROUP BY cv.content_id
) reviews
WHERE c.id = reviews.content_id;

-- Preserve linked source/rights information in metadata.
UPDATE "contents" c
SET "metadata" = c."metadata" || jsonb_build_object('sources', sources.value)
FROM (
    SELECT cv.content_id, jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'type', sm.material_type::text,
        'text', sm.raw_text,
        'platform', sm.source_platform,
        'name', sm.source_name,
        'url', sm.source_url,
        'license', sm.source_license,
        'usage', sm.usage_mode::text,
        'rights', sm.rights_status::text,
        'relationship', cvs.relationship_type::text,
        'note', cvs.review_note
    ))) AS value
    FROM "content_version_sources" cvs
    JOIN "content_versions" cv ON cv.id = cvs.content_version_id
    JOIN "content_items" ci ON ci.id = cv.content_id AND ci.current_version_id = cv.id
    JOIN "source_materials" sm ON sm.id = cvs.source_material_id
    GROUP BY cv.content_id
) sources
WHERE c.id = sources.content_id;

CREATE TABLE "user_devices" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "push_token" VARCHAR(255) NOT NULL,
    "platform" VARCHAR(20) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_devices_push_token_key" ON "user_devices"("push_token");
CREATE INDEX "user_devices_user_id_enabled_idx" ON "user_devices"("user_id", "enabled");
ALTER TABLE "user_devices"
    ADD CONSTRAINT "user_devices_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "user_content_preferences" (
    "user_id" UUID NOT NULL,
    "content_id" UUID NOT NULL,
    "reaction" VARCHAR(20),
    "saved_at" TIMESTAMPTZ(6),
    "hidden_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_content_preferences_pkey" PRIMARY KEY ("user_id", "content_id")
);

CREATE INDEX "user_content_preferences_user_id_saved_at_idx"
    ON "user_content_preferences"("user_id", "saved_at");
ALTER TABLE "user_content_preferences"
    ADD CONSTRAINT "user_content_preferences_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_content_preferences"
    ADD CONSTRAINT "user_content_preferences_content_id_fkey"
    FOREIGN KEY ("content_id") REFERENCES "contents"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Rewire deliveries to contents and preserve the exact historical payload.
ALTER TABLE "content_deliveries"
    DROP CONSTRAINT "content_deliveries_content_id_fkey",
    DROP CONSTRAINT "content_deliveries_content_version_id_fkey";

ALTER TABLE "content_deliveries" ADD COLUMN "content_snapshot" JSONB NOT NULL DEFAULT '{}';

UPDATE "content_deliveries" cd
SET "content_snapshot" = jsonb_build_object(
    'text', cv.text,
    'format', ci.content_type::text,
    'languageCode', ci.language_code
)
FROM "content_versions" cv
JOIN "content_items" ci ON ci.id = cv.content_id
WHERE cd.content_version_id = cv.id;

DROP INDEX "content_deliveries_content_version_id_created_at_idx";
DROP INDEX "uq_user_content_daily_delivery";

ALTER TABLE "content_deliveries" DROP COLUMN "content_version_id";
ALTER TABLE "content_deliveries" RENAME COLUMN "context_snapshot" TO "context";
ALTER TABLE "content_deliveries" RENAME COLUMN "selection_reason" TO "metadata";
ALTER TABLE "content_deliveries"
    ALTER COLUMN "channel" TYPE VARCHAR(30) USING "channel"::text,
    ALTER COLUMN "channel" SET DEFAULT 'push',
    ALTER COLUMN "status" TYPE VARCHAR(30) USING "status"::text,
    ALTER COLUMN "status" SET DEFAULT 'scheduled',
    ALTER COLUMN "ranking_score" TYPE DOUBLE PRECISION USING "ranking_score"::double precision;

CREATE UNIQUE INDEX "uq_user_daily_delivery"
    ON "content_deliveries"("user_id", "delivery_date_local", "channel");
CREATE INDEX "content_deliveries_content_id_created_at_idx"
    ON "content_deliveries"("content_id", "created_at");
ALTER TABLE "content_deliveries"
    ADD CONSTRAINT "content_deliveries_content_id_fkey"
    FOREIGN KEY ("content_id") REFERENCES "contents"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Rewire the append-only event stream and make event names extensible strings.
ALTER TABLE "user_content_events"
    DROP CONSTRAINT "user_content_events_content_id_fkey",
    DROP CONSTRAINT "user_content_events_content_version_id_fkey";
ALTER TABLE "user_content_events"
    DROP COLUMN "content_version_id",
    ALTER COLUMN "event_type" TYPE VARCHAR(50) USING "event_type"::text,
    ALTER COLUMN "session_id" TYPE VARCHAR(100) USING "session_id"::text;
ALTER TABLE "user_content_events" RENAME COLUMN "event_context" TO "metadata";
ALTER TABLE "user_content_events"
    ADD CONSTRAINT "user_content_events_content_id_fkey"
    FOREIGN KEY ("content_id") REFERENCES "contents"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- The old editorial/CMS tables are now represented by contents, tags and JSON
-- metadata. Drop in dependency order.
ALTER TABLE "content_items" DROP CONSTRAINT "content_items_current_version_id_fkey";
DROP TABLE "content_reviews";
DROP TABLE "content_context_rules";
DROP TABLE "content_version_sources";
DROP TABLE "content_version_terms";
DROP TABLE "source_materials";
DROP TABLE "taxonomy_terms";
DROP TABLE "content_versions";
DROP TABLE "content_items";

DROP TYPE "content_type";
DROP TYPE "content_status";
DROP TYPE "origin_type";
DROP TYPE "rights_status";
DROP TYPE "taxonomy_term_type";
DROP TYPE "metadata_source";
DROP TYPE "context_dimension";
DROP TYPE "context_match_type";
DROP TYPE "material_type";
DROP TYPE "material_status";
DROP TYPE "source_usage_mode";
DROP TYPE "source_relationship_type";
DROP TYPE "evaluator_type";
DROP TYPE "review_decision";
DROP TYPE "delivery_channel";
DROP TYPE "delivery_status";
DROP TYPE "user_content_event_type";

-- A delivered payload is immutable without requiring a version table. Drafts
-- can still be edited, while delivered content must be archived and replaced.
CREATE FUNCTION prevent_delivered_content_mutation()
RETURNS trigger AS $$
BEGIN
    IF (OLD."text", OLD."format", OLD."language_code")
       IS DISTINCT FROM
       (NEW."text", NEW."format", NEW."language_code")
       AND EXISTS (
           SELECT 1 FROM "content_deliveries" cd WHERE cd."content_id" = OLD."id"
       ) THEN
        RAISE EXCEPTION 'Delivered content is immutable; archive it and create a new content row';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "contents_prevent_delivered_mutation"
BEFORE UPDATE OF "text", "format", "language_code" ON "contents"
FOR EACH ROW EXECUTE FUNCTION prevent_delivered_content_mutation();
