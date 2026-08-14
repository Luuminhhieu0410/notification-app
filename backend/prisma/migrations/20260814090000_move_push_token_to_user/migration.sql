ALTER TABLE "users"
    ADD COLUMN "push_token" VARCHAR(255);

-- A user represents one anonymous app installation. Preserve its newest
-- enabled token while collapsing the former one-to-many device table.
UPDATE "users" AS u
SET "push_token" = (
    SELECT ud."push_token"
    FROM "user_devices" AS ud
    WHERE ud."user_id" = u."id"
      AND ud."enabled" = TRUE
    ORDER BY ud."last_seen_at" DESC, ud."id" DESC
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1
    FROM "user_devices" AS ud
    WHERE ud."user_id" = u."id"
      AND ud."enabled" = TRUE
);

CREATE UNIQUE INDEX "users_push_token_key" ON "users"("push_token");

DROP TABLE "user_devices";
