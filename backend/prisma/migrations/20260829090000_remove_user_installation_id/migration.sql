DROP INDEX IF EXISTS "users_installation_id_key";

ALTER TABLE "users" DROP COLUMN IF EXISTS "installation_id";
