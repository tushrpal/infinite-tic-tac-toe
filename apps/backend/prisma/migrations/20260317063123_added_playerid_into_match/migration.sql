-- Historical cleanup migration:
-- only drop default if Move.playerId already exists.
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_name = 'Move' AND column_name = 'playerId'
	) THEN
		ALTER TABLE "Move" ALTER COLUMN "playerId" DROP DEFAULT;
	END IF;
END $$;
