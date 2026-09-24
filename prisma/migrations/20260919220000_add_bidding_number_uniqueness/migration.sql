-- Bidding numbers are public identifiers and must remain unique.
CREATE UNIQUE INDEX "Bidding_number_key" ON "Bidding"("number");
