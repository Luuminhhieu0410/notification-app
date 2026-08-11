-- Anonymous installations are idempotently identified by installation_id.
-- Existing users remain valid and receive their migration time as install_at.
ALTER TABLE "users"
    ADD COLUMN "installation_id" VARCHAR(100),
    ADD COLUMN "platform" VARCHAR(20) NOT NULL DEFAULT 'unknown',
    ADD COLUMN "device_name" VARCHAR(150),
    ADD COLUMN "os_version" VARCHAR(50),
    ADD COLUMN "app_version" VARCHAR(50),
    ADD COLUMN "install_at" TIMESTAMPTZ(6);

UPDATE "users" SET "install_at" = "created_at" WHERE "install_at" IS NULL;

ALTER TABLE "users"
    ALTER COLUMN "install_at" SET NOT NULL,
    ALTER COLUMN "install_at" SET DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "users_installation_id_key" ON "users"("installation_id");

ALTER TABLE "notification_settings"
    ALTER COLUMN "local_send_time" SET DEFAULT '07:00:00'::time without time zone;
