# Smart Parking Lot System

A backend service that manages vehicle entry/exit, parking spot allocation, and fee calculation with real-time availability and admin summary endpoints.

This implementation uses Node.js (TypeScript), Express, and Prisma ORM with SQLite for local development. It’s production-ready to switch to PostgreSQL by updating the Prisma datasource URL.

## Architecture Overview

- API: Express + Zod validation, Swagger docs at /docs
- Data access: Prisma ORM
- Core engines:
	- Allocation engine: atomically claims an available spot based on vehicle type priority with race-safe updates
	- Fee engine: configurable base + hourly rate per vehicle type (rounded up to the next hour)
- Concurrency: update-many guard ensures a spot can be claimed by only one concurrent request
- Logging: Winston console logger

### Data Model

- Vehicle(id, numberPlate unique, type)
- Floor(id, level, name, unique(level,name))
- ParkingSpot(id, floorId, code, type, isOccupied, unique(floorId,code))
- ParkingTicket(id, vehicleId, spotId, entryTime, exitTime?, feeCents?, closed)

See `prisma/schema.prisma` for full details.

## Tech Stack

- Node.js 18+, TypeScript 5+
- Express 5, Zod, CORS, dotenv
- Prisma ORM, SQLite (dev). Switchable to PostgreSQL
- Jest + ts-jest + Supertest for tests
- Swagger UI at /docs

## Setup Instructions

1) Clone and install

```pwsh
# from the repo root
npm install
```

2) Configure environment

Copy `.env.example` to `.env` and adjust as needed. By default this uses SQLite:

```env
DATABASE_URL="file:./prisma/dev.db"
PORT=3000
# Fee rates (cents)
FEE_MOTORCYCLE_PER_HOUR=100
FEE_CAR_PER_HOUR=200
FEE_BUS_PER_HOUR=500
BASE_FEE_MOTORCYCLE=50
BASE_FEE_CAR=100
BASE_FEE_BUS=200
```

3) Initialize database

```pwsh
npx prisma migrate dev --name init
npm run prisma:seed
```

4) Run the server (dev)

```pwsh
npm run dev
# API: http://localhost:3000
# Docs: http://localhost:3000/docs
```

5) Build and run (prod-style)

```pwsh
npm run build
npm start
```

## Endpoints

All endpoints are under `/api`.

- POST `/api/entry`
	- Purpose: Register vehicle entry and assign a spot
	- Request body: { numberPlate: string, vehicleType: "MOTORCYCLE" | "CAR" | "BUS" }
	- Responses:
		- 201: { ticketId, vehicle, spot, entryTime }
		- 409: { error: "VehicleAlreadyParked", ticketId }
		- 503: { error: "NoSpotAvailable" }

- POST `/api/exit`
	- Purpose: Record exit, calculate total fee, and release the spot
	- Request body: { ticketId?: string, numberPlate?: string }
	- Responses:
		- 200: { ticketId, numberPlate, feeCents, exitTime }
		- 404: { error: "OpenTicketNotFound" }

- GET `/api/availability`
	- Purpose: Real-time status by floor and type
	- Response: { floors: Array<{ floorId, level, name, total, available, byType: { MOTORCYCLE, CAR, BUS } }> }

- GET `/api/summary`
	- Purpose: Admin metrics (tickets and revenue)
	- Response: { totalTickets, totalRevenueCents, openTickets }

OpenAPI docs: `GET /docs`.

## Allocation Algorithm

- Vehicle type maps to allowed spot types with priority:
	- MOTORCYCLE -> [MOTORCYCLE, CAR, BUS]
	- CAR -> [CAR, BUS]
	- BUS -> [BUS]
- For each allowed type, find the first available spot (ordered by floor level then code)
- Atomically claim the spot using an `updateMany` with guard `isOccupied=false`
- If update count = 1, the claimant wins; otherwise retry with the next candidate

This guarantees no double-allocation even under concurrent requests (works with SQLite; translates to robust patterns for PostgreSQL as well).

## Fee Calculation

- Fee = base(vehicleType) + ceil(hours(entry->exit)) * perHour(vehicleType)
- Rates configured via environment variables (cents)

## Testing

Run all tests:

```pwsh
npm test
```

Includes:
- Unit tests (fee calculation)
- Concurrency tests (allocation engine under parallel calls)
- Integration tests (API: entry, exit, availability, summary)

## Switching to PostgreSQL (optional)

1) Set `DATABASE_URL` in `.env` to your Postgres connection string.
2) Update `provider` in `prisma/schema.prisma` datasource to `postgresql`.
3) Run:

```pwsh
npx prisma migrate dev
npx prisma generate
```

## Error Codes

- 400 ValidationError (Zod)
- 404 OpenTicketNotFound
- 409 VehicleAlreadyParked
- 503 NoSpotAvailable

## Folder Structure

- `src/` Express app, routes, services (allocation, fee), Prisma client, config, logger
- `prisma/` Prisma schema, migrations, seed script
- `tests/` Jest tests (unit, integration, concurrency)

---

Made for the Smart Parking Lot System project. 🚗🅿️
