-- AlterTable
ALTER TABLE "notification_settings" ALTER COLUMN "local_send_time" SET DEFAULT '07:30:00'::time without time zone,
ALTER COLUMN "days_of_week" SET DEFAULT ARRAY[1, 2, 3, 4, 5, 6, 7]::SMALLINT[];
