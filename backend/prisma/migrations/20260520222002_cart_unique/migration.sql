/*
  Warnings:

  - A unique constraint covering the columns `[id,userId]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CartItem_id_userId_key" ON "CartItem"("id", "userId");
