-- AlterTable
ALTER TABLE "DEVICES" ADD COLUMN     "schedule_enabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "SCHEDULES" ADD COLUMN     "icon" TEXT NOT NULL DEFAULT 'sprout',
ADD COLUMN     "title" TEXT NOT NULL DEFAULT 'Chu kỳ tưới',
ADD COLUMN     "zone" TEXT NOT NULL DEFAULT 'Khu vực';
