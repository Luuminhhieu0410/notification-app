-- CreateEnum
CREATE TYPE "content_type" AS ENUM ('quote', 'poem_2_lines', 'poem_4_lines', 'luc_bat', 'rhyming_caption', 'mini_story');

-- CreateEnum
CREATE TYPE "content_status" AS ENUM ('draft', 'reviewing', 'approved', 'published', 'rejected', 'archived');

-- CreateEnum
CREATE TYPE "origin_type" AS ENUM ('human', 'ai_generated', 'ai_assisted', 'community', 'adapted');

-- CreateEnum
CREATE TYPE "rights_status" AS ENUM ('owned', 'licensed', 'public_domain', 'restricted', 'unknown');

-- CreateEnum
CREATE TYPE "taxonomy_term_type" AS ENUM ('topic', 'situation', 'audience', 'tone', 'emotion', 'humor_mechanism');

-- CreateEnum
CREATE TYPE "metadata_source" AS ENUM ('manual', 'ai', 'rule');

-- CreateEnum
CREATE TYPE "context_dimension" AS ENUM ('moment', 'day_type', 'weekday', 'occasion', 'weather', 'season', 'locale');

-- CreateEnum
CREATE TYPE "context_match_type" AS ENUM ('required', 'preferred', 'excluded');

-- CreateEnum
CREATE TYPE "material_type" AS ENUM ('quote', 'proverb', 'poem', 'observation', 'object', 'situation', 'phrase', 'pattern', 'punchline_seed');

-- CreateEnum
CREATE TYPE "material_status" AS ENUM ('active', 'archived', 'rejected');

-- CreateEnum
CREATE TYPE "source_usage_mode" AS ENUM ('original', 'copied', 'adapted', 'pattern_only', 'reference_only');

-- CreateEnum
CREATE TYPE "source_relationship_type" AS ENUM ('copied', 'translated', 'adapted', 'inspired', 'pattern_extracted');

-- CreateEnum
CREATE TYPE "evaluator_type" AS ENUM ('human', 'ai', 'algorithm');

-- CreateEnum
CREATE TYPE "review_decision" AS ENUM ('approved', 'rejected', 'changes_requested');

-- CreateEnum
CREATE TYPE "delivery_channel" AS ENUM ('push', 'in_app', 'widget', 'email');

-- CreateEnum
CREATE TYPE "delivery_status" AS ENUM ('scheduled', 'sent', 'delivered', 'opened', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "user_content_event_type" AS ENUM ('impression', 'notification_opened', 'liked', 'unliked', 'disliked', 'saved', 'shared', 'skipped', 'dismissed', 'reported_boring', 'reported_offensive');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "locale" VARCHAR(20) NOT NULL DEFAULT 'vi-VN',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_items" (
    "id" UUID NOT NULL,
    "content_type" "content_type" NOT NULL,
    "language_code" VARCHAR(10) NOT NULL DEFAULT 'vi',
    "status" "content_status" NOT NULL DEFAULT 'draft',
    "origin_type" "origin_type" NOT NULL,
    "rights_status" "rights_status" NOT NULL DEFAULT 'unknown',
    "author_user_id" UUID,
    "current_version_id" UUID,
    "publishable" BOOLEAN NOT NULL DEFAULT false,
    "sensitive_level" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "published_at" TIMESTAMPTZ(6),
    "archived_at" TIMESTAMPTZ(6),

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_versions" (
    "id" UUID NOT NULL,
    "content_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "normalized_text" TEXT NOT NULL,
    "text_hash" VARCHAR(64) NOT NULL,
    "title" VARCHAR(255),
    "character_count" INTEGER NOT NULL,
    "word_count" INTEGER NOT NULL,
    "line_count" SMALLINT NOT NULL,
    "analysis" JSONB NOT NULL DEFAULT '{}',
    "metadata_schema_version" INTEGER NOT NULL DEFAULT 1,
    "change_reason" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxonomy_terms" (
    "id" UUID NOT NULL,
    "term_type" "taxonomy_term_type" NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "label" VARCHAR(150) NOT NULL,
    "parent_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "taxonomy_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_version_terms" (
    "content_version_id" UUID NOT NULL,
    "term_id" UUID NOT NULL,
    "weight" DECIMAL(5,4) NOT NULL DEFAULT 1,
    "confidence" DECIMAL(5,4),
    "assigned_by" "metadata_source" NOT NULL DEFAULT 'manual',
    "human_confirmed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "content_version_terms_pkey" PRIMARY KEY ("content_version_id","term_id")
);

-- CreateTable
CREATE TABLE "content_context_rules" (
    "id" UUID NOT NULL,
    "content_version_id" UUID NOT NULL,
    "dimension" "context_dimension" NOT NULL,
    "match_type" "context_match_type" NOT NULL,
    "value" JSONB NOT NULL,
    "weight" DECIMAL(6,3) NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_context_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_materials" (
    "id" UUID NOT NULL,
    "material_type" "material_type" NOT NULL,
    "raw_text" TEXT NOT NULL,
    "normalized_text" TEXT NOT NULL,
    "language_code" VARCHAR(10) NOT NULL DEFAULT 'vi',
    "source_platform" VARCHAR(50),
    "source_name" VARCHAR(255),
    "source_url" TEXT,
    "external_id" VARCHAR(255),
    "author_name" VARCHAR(255),
    "source_license" VARCHAR(100),
    "usage_mode" "source_usage_mode" NOT NULL DEFAULT 'reference_only',
    "rights_status" "rights_status" NOT NULL DEFAULT 'unknown',
    "quality_score" DECIMAL(5,4),
    "novelty_score" DECIMAL(5,4),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" "material_status" NOT NULL DEFAULT 'active',
    "source_published_at" TIMESTAMPTZ(6),
    "collected_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_version_sources" (
    "content_version_id" UUID NOT NULL,
    "source_material_id" UUID NOT NULL,
    "relationship_type" "source_relationship_type" NOT NULL,
    "lexical_similarity" DECIMAL(5,4),
    "semantic_similarity" DECIMAL(5,4),
    "review_note" TEXT,

    CONSTRAINT "content_version_sources_pkey" PRIMARY KEY ("content_version_id","source_material_id")
);

-- CreateTable
CREATE TABLE "content_reviews" (
    "id" UUID NOT NULL,
    "content_version_id" UUID NOT NULL,
    "reviewer_type" "evaluator_type" NOT NULL DEFAULT 'human',
    "reviewer_user_id" UUID,
    "evaluator_id" VARCHAR(255),
    "decision" "review_decision" NOT NULL,
    "scores" JSONB NOT NULL DEFAULT '{}',
    "reasons" JSONB NOT NULL DEFAULT '[]',
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "user_id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "local_send_time" TIME(0) NOT NULL DEFAULT '07:30:00'::time without time zone,
    "days_of_week" SMALLINT[] DEFAULT ARRAY[1, 2, 3, 4, 5, 6, 7]::SMALLINT[],
    "quiet_hours_start" TIME(0),
    "quiet_hours_end" TIME(0),
    "weather_enabled" BOOLEAN NOT NULL DEFAULT false,
    "city_code" VARCHAR(100),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "content_deliveries" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content_id" UUID NOT NULL,
    "content_version_id" UUID NOT NULL,
    "channel" "delivery_channel" NOT NULL DEFAULT 'push',
    "scheduled_for" TIMESTAMPTZ(6) NOT NULL,
    "delivery_date_local" DATE NOT NULL,
    "sent_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "opened_at" TIMESTAMPTZ(6),
    "status" "delivery_status" NOT NULL DEFAULT 'scheduled',
    "failure_reason" TEXT,
    "context_snapshot" JSONB NOT NULL DEFAULT '{}',
    "selection_reason" JSONB NOT NULL DEFAULT '{}',
    "ranking_score" DECIMAL(10,6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_content_events" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "content_id" UUID NOT NULL,
    "content_version_id" UUID,
    "event_type" "user_content_event_type" NOT NULL,
    "delivery_id" UUID,
    "session_id" UUID,
    "event_context" JSONB NOT NULL DEFAULT '{}',
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_content_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "content_items_current_version_id_key" ON "content_items"("current_version_id");

-- CreateIndex
CREATE INDEX "content_items_status_publishable_content_type_idx" ON "content_items"("status", "publishable", "content_type");

-- CreateIndex
CREATE INDEX "content_items_published_at_idx" ON "content_items"("published_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_content_version_text_hash" ON "content_versions"("text_hash");

-- CreateIndex
CREATE INDEX "content_versions_content_id_created_at_idx" ON "content_versions"("content_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "content_versions_content_id_version_number_key" ON "content_versions"("content_id", "version_number");

-- CreateIndex
CREATE INDEX "taxonomy_terms_parent_id_idx" ON "taxonomy_terms"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "taxonomy_terms_term_type_code_key" ON "taxonomy_terms"("term_type", "code");

-- CreateIndex
CREATE INDEX "content_version_terms_term_id_weight_idx" ON "content_version_terms"("term_id", "weight");

-- CreateIndex
CREATE INDEX "content_context_rules_content_version_id_dimension_idx" ON "content_context_rules"("content_version_id", "dimension");

-- CreateIndex
CREATE INDEX "content_context_rules_dimension_match_type_idx" ON "content_context_rules"("dimension", "match_type");

-- CreateIndex
CREATE INDEX "content_context_rules_value_idx" ON "content_context_rules" USING GIN ("value");

-- CreateIndex
CREATE INDEX "source_materials_material_type_status_idx" ON "source_materials"("material_type", "status");

-- CreateIndex
CREATE INDEX "source_materials_source_platform_external_id_idx" ON "source_materials"("source_platform", "external_id");

-- CreateIndex
CREATE INDEX "source_materials_collected_at_idx" ON "source_materials"("collected_at");

-- CreateIndex
CREATE INDEX "content_version_sources_source_material_id_relationship_typ_idx" ON "content_version_sources"("source_material_id", "relationship_type");

-- CreateIndex
CREATE INDEX "content_reviews_content_version_id_created_at_idx" ON "content_reviews"("content_version_id", "created_at");

-- CreateIndex
CREATE INDEX "content_reviews_decision_created_at_idx" ON "content_reviews"("decision", "created_at");

-- CreateIndex
CREATE INDEX "content_deliveries_status_scheduled_for_idx" ON "content_deliveries"("status", "scheduled_for");

-- CreateIndex
CREATE INDEX "content_deliveries_user_id_created_at_idx" ON "content_deliveries"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "content_deliveries_content_version_id_created_at_idx" ON "content_deliveries"("content_version_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_content_daily_delivery" ON "content_deliveries"("user_id", "content_id", "delivery_date_local", "channel");

-- CreateIndex
CREATE INDEX "idx_user_events_user_time" ON "user_content_events"("user_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "idx_user_events_content_type" ON "user_content_events"("content_id", "event_type");

-- CreateIndex
CREATE INDEX "idx_user_events_type_time" ON "user_content_events"("event_type", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "user_content_events_delivery_id_idx" ON "user_content_events"("delivery_id");

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "content_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxonomy_terms" ADD CONSTRAINT "taxonomy_terms_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "taxonomy_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_version_terms" ADD CONSTRAINT "content_version_terms_content_version_id_fkey" FOREIGN KEY ("content_version_id") REFERENCES "content_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_version_terms" ADD CONSTRAINT "content_version_terms_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "taxonomy_terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_context_rules" ADD CONSTRAINT "content_context_rules_content_version_id_fkey" FOREIGN KEY ("content_version_id") REFERENCES "content_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_version_sources" ADD CONSTRAINT "content_version_sources_content_version_id_fkey" FOREIGN KEY ("content_version_id") REFERENCES "content_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_version_sources" ADD CONSTRAINT "content_version_sources_source_material_id_fkey" FOREIGN KEY ("source_material_id") REFERENCES "source_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reviews" ADD CONSTRAINT "content_reviews_content_version_id_fkey" FOREIGN KEY ("content_version_id") REFERENCES "content_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reviews" ADD CONSTRAINT "content_reviews_reviewer_user_id_fkey" FOREIGN KEY ("reviewer_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_deliveries" ADD CONSTRAINT "content_deliveries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_deliveries" ADD CONSTRAINT "content_deliveries_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_deliveries" ADD CONSTRAINT "content_deliveries_content_version_id_fkey" FOREIGN KEY ("content_version_id") REFERENCES "content_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_content_events" ADD CONSTRAINT "user_content_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_content_events" ADD CONSTRAINT "user_content_events_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_content_events" ADD CONSTRAINT "user_content_events_content_version_id_fkey" FOREIGN KEY ("content_version_id") REFERENCES "content_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_content_events" ADD CONSTRAINT "user_content_events_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "content_deliveries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
