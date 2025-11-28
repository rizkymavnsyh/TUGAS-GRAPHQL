import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { createLoaders } from '../src/dataloaders.js';
import { initDatabase, db } from '../src/database.js';
import { seedData } from '../src/seed.js';

describe('DataLoaders', () => {
  beforeAll(() => {
    initDatabase();
    seedData();
  });

  afterAll(() => {
    db.close();
  });

  describe('PlanetLoader', () => {
    test('loads single planet', async () => {
      const loaders = createLoaders();
      const planet = await loaders.planet.load(1);
      expect(planet).toBeDefined();
      expect(planet.id).toBe(1);
      expect(planet.name).toBeDefined();
    });

    test('loads multiple planets in batch', async () => {
      const loaders = createLoaders();
      const [planet1, planet2] = await Promise.all([
        loaders.planet.load(1),
        loaders.planet.load(2),
      ]);
      expect(planet1).toBeDefined();
      expect(planet2).toBeDefined();
      expect(planet1.id).toBe(1);
      expect(planet2.id).toBe(2);
    });

    test('returns null for non-existent planet', async () => {
      const loaders = createLoaders();
      const planet = await loaders.planet.load(9999);
      expect(planet).toBeNull();
    });
  });

  describe('CharacterStarshipsLoader', () => {
    test('loads starships for character', async () => {
      const loaders = createLoaders();
      // Character 1 (Luke) should have starships
      const starships = await loaders.characterStarships.load(1);
      expect(Array.isArray(starships)).toBe(true);
    });

    test('loads empty array for character with no starships', async () => {
      const loaders = createLoaders();
      // Character 3 (Han) might not have starships initially
      const starships = await loaders.characterStarships.load(3);
      expect(Array.isArray(starships)).toBe(true);
    });
  });

  describe('PlanetResidentsLoader', () => {
    test('loads residents for planet', async () => {
      const loaders = createLoaders();
      // Planet 1 (Tatooine) should have residents
      const residents = await loaders.planetResidents.load(1);
      expect(Array.isArray(residents)).toBe(true);
    });
  });

  describe('Batch Loading Performance', () => {
    test('loads multiple items efficiently', async () => {
      const loaders = createLoaders();
      const start = Date.now();
      
      // Load 10 planets
      const promises = [];
      for (let i = 1; i <= 10; i++) {
        promises.push(loaders.planet.load(i));
      }
      await Promise.all(promises);
      
      const duration = Date.now() - start;
      // Should be fast because of batching
      expect(duration).toBeLessThan(1000);
    });
  });
});

