-- AlterTable
ALTER TABLE "notification_settings" ALTER COLUMN "days_of_week" SET DEFAULT ARRAY[1, 2, 3, 4, 5, 6, 7]::SMALLINT[];
