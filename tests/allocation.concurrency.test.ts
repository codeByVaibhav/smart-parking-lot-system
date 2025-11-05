import { prisma } from '../src/prisma';
import { allocateSpotAtomic, releaseSpot } from '../src/services/allocation';
import { resetDb } from './helpers';

jest.setTimeout(20000);

describe('Allocation concurrency', () => {
  beforeAll(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  it('does not double-allocate the same spot under parallel requests', async () => {
    const parallel = 30; // attempt to allocate many CAR spots in parallel
    const promises = Array.from({ length: parallel }).map(() => allocateSpotAtomic('CAR'));
    const results = await Promise.all(promises);

    const claimed = results.filter((r) => r !== null) as any[];

    // Ensure no duplicate spotIds
    const unique = new Set(claimed.map((r) => r.spotId));
    expect(unique.size).toBe(claimed.length);

    // Release claimed
    await Promise.all(claimed.map((r) => releaseSpot(r.spotId)));
  });
});
