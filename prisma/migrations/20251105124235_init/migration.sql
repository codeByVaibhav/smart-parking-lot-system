-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numberPlate" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Floor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ParkingSpot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isOccupied" BOOLEAN NOT NULL DEFAULT false,
    "floorId" TEXT NOT NULL,
    CONSTRAINT "ParkingSpot_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ParkingTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "entryTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitTime" DATETIME,
    "feeCents" INTEGER,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ParkingTicket_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ParkingTicket_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "ParkingSpot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_numberPlate_key" ON "Vehicle"("numberPlate");

-- CreateIndex
CREATE UNIQUE INDEX "Floor_level_name_key" ON "Floor"("level", "name");

-- CreateIndex
CREATE INDEX "ParkingSpot_type_isOccupied_idx" ON "ParkingSpot"("type", "isOccupied");

-- CreateIndex
CREATE UNIQUE INDEX "ParkingSpot_floorId_code_key" ON "ParkingSpot"("floorId", "code");

-- CreateIndex
CREATE INDEX "ParkingTicket_vehicleId_closed_idx" ON "ParkingTicket"("vehicleId", "closed");

-- CreateIndex
CREATE INDEX "ParkingTicket_spotId_closed_idx" ON "ParkingTicket"("spotId", "closed");
