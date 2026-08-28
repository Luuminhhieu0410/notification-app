-- Make content type and author explicit domain entities. The migration aborts
-- instead of guessing when legacy data cannot be mapped safely.

CREATE TABLE "content_types" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "content_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "content_types_slug_key" ON "content_types"("slug");

INSERT INTO "content_types" ("id", "slug", "name", "updated_at") VALUES
    ('00000000-0000-4000-8000-000000000001', 'prose', 'Văn xuôi', CURRENT_TIMESTAMP),
    ('00000000-0000-4000-8000-000000000002', 'quote', 'Câu nói', CURRENT_TIMESTAMP),
    ('00000000-0000-4000-8000-000000000003', 'poem-2-lines', 'Thơ 2 dòng', CURRENT_TIMESTAMP),
    ('00000000-0000-4000-8000-000000000004', 'poem-4-lines', 'Thơ 4 dòng', CURRENT_TIMESTAMP),
    ('00000000-0000-4000-8000-000000000005', 'luc-bat', 'Thơ lục bát', CURRENT_TIMESTAMP);

CREATE TABLE "authors" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "bio" TEXT,
    "source_url" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "authors_slug_key" ON "authors"("slug");

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "contents" WHERE "author_user_id" IS NOT NULL) THEN
        RAISE EXCEPTION 'Cannot migrate contents.author_user_id automatically; map legacy installation users to authors explicitly';
    END IF;
END;
$$;

ALTER TABLE "contents"
    ADD COLUMN "content_type_id" UUID,
    ADD COLUMN "author_id" UUID;

UPDATE "contents" c
SET "content_type_id" = CASE c."format"
    WHEN 'prose' THEN '00000000-0000-4000-8000-000000000001'::uuid
    WHEN 'quote' THEN '00000000-0000-4000-8000-000000000002'::uuid
    WHEN 'poem_2_lines' THEN '00000000-0000-4000-8000-000000000003'::uuid
    WHEN 'poem_4_lines' THEN '00000000-0000-4000-8000-000000000004'::uuid
    WHEN 'luc_bat' THEN '00000000-0000-4000-8000-000000000005'::uuid
    ELSE NULL
END;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "contents" WHERE "content_type_id" IS NULL) THEN
        RAISE EXCEPTION 'Cannot map one or more legacy contents.format values to content_types';
    END IF;
END;
$$;

ALTER TABLE "contents" ALTER COLUMN "content_type_id" SET NOT NULL;

ALTER TABLE "contents"
    ADD CONSTRAINT "contents_content_type_id_fkey"
    FOREIGN KEY ("content_type_id") REFERENCES "content_types"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "contents_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "authors"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "content_deliveries" cd
SET "content_snapshot" = cd."content_snapshot" || jsonb_build_object(
    'id', c."id",
    'key', c."key",
    'text', c."text",
    'languageCode', c."language_code",
    'contentType', jsonb_build_object('slug', ct."slug", 'name', ct."name"),
    'author', CASE
        WHEN a."id" IS NULL THEN NULL
        ELSE jsonb_build_object('id', a."id", 'slug', a."slug", 'name', a."name")
    END
)
FROM "contents" c
JOIN "content_types" ct ON ct."id" = c."content_type_id"
LEFT JOIN "authors" a ON a."id" = c."author_id"
WHERE cd."content_id" = c."id";

DROP TRIGGER "contents_prevent_delivered_mutation" ON "contents";
DROP FUNCTION prevent_delivered_content_mutation();

DROP INDEX "contents_status_format_idx";
CREATE INDEX "contents_status_content_type_id_idx"
    ON "contents"("status", "content_type_id");

ALTER TABLE "contents"
    DROP CONSTRAINT "contents_author_user_id_fkey",
    DROP COLUMN "author_user_id",
    DROP COLUMN "format";

CREATE FUNCTION prevent_delivered_content_mutation()
RETURNS trigger AS $$
BEGIN
    IF (OLD."text", OLD."content_type_id", OLD."language_code")
       IS DISTINCT FROM
       (NEW."text", NEW."content_type_id", NEW."language_code")
       AND EXISTS (
           SELECT 1 FROM "content_deliveries" cd WHERE cd."content_id" = OLD."id"
       ) THEN
        RAISE EXCEPTION 'Delivered content is immutable; archive it and create a new content row';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "contents_prevent_delivered_mutation"
BEFORE UPDATE OF "text", "content_type_id", "language_code" ON "contents"
FOR EACH ROW EXECUTE FUNCTION prevent_delivered_content_mutation();
