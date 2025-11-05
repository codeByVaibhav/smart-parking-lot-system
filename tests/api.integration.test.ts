import request from 'supertest';
import { createApp } from '../src/server';
import { resetDb } from './helpers';
import { prisma } from '../src/prisma';

const app = createApp();

describe('API integration', () => {
  beforeAll(async () => {
    await resetDb();
  });
  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  it('entry -> exit flow for a CAR', async () => {
    const entry = await request(app)
      .post('/api/entry')
      .send({ numberPlate: 'KA-01-AB-1234', vehicleType: 'CAR' })
      .expect(201);

    expect(entry.body.ticketId).toBeTruthy();
    expect(entry.body.spot).toBeTruthy();

    const exit = await request(app)
      .post('/api/exit')
      .send({ ticketId: entry.body.ticketId })
      .expect(200);

    expect(exit.body.feeCents).toBeGreaterThan(0);
  });

  it('availability and summary endpoints', async () => {
    const availability = await request(app).get('/api/availability').expect(200);
    expect(Array.isArray(availability.body.floors)).toBe(true);

    const summary = await request(app).get('/api/summary').expect(200);
    expect(summary.body).toHaveProperty('totalTickets');
  });
});
