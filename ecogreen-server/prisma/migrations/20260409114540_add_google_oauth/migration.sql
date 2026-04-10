/*
  Warnings:

  - A unique constraint covering the columns `[provider_id]` on the table `USERS` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "USERS" ADD COLUMN     "auth_provider" TEXT NOT NULL DEFAULT 'local',
ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "provider_id" TEXT,
ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "USERS_provider_id_key" ON "USERS"("provider_id");
