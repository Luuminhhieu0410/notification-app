-- Keep a single logical content assignment per user/day. If legacy data has
-- separate in-app and push rows, retain the oldest assignment.
DELETE FROM "content_deliveries" newer
USING "content_deliveries" older
WHERE newer."user_id" = older."user_id"
  AND newer."delivery_date_local" = older."delivery_date_local"
  AND (
    newer."created_at" > older."created_at"
    OR (
      newer."created_at" = older."created_at"
      AND newer."id" > older."id"
    )
  );

DROP INDEX "uq_user_daily_delivery";

ALTER TABLE "content_deliveries"
  DROP COLUMN "channel";

CREATE UNIQUE INDEX "uq_user_daily_delivery"
  ON "content_deliveries" ("user_id", "delivery_date_local");

-- The scheduler supports whole-hour slots only. Normalize the legacy default
-- so existing users shown as "7 giờ" are actually selected by the 07:00 cron.
UPDATE "notification_settings"
SET "local_send_time" = '07:00:00'
WHERE "local_send_time" = '07:30:00';

ALTER TABLE "notification_settings"
  ALTER COLUMN "local_send_time" SET DEFAULT '07:00:00';
