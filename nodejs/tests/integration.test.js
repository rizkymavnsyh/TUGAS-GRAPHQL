import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { resolvers } from '../src/resolvers.js';
import { initDatabase, db } from '../src/database.js';
import { seedData } from '../src/seed.js';
import { createLoaders } from '../src/dataloaders.js';

describe('Integration Tests', () => {
  beforeAll(() => {
    initDatabase();
    seedData();
  });

  afterAll(() => {
    db.close();
  });

  describe('Full CRUD Flow', () => {
    test('Create, Read, Update, Delete Planet', () => {
      // Create
      const createInput = {
        name: 'Integration Test Planet',
        climate: 'Test Climate',
        terrain: 'Test Terrain',
      };
      const created = resolvers.Mutation.createPlanet(null, { input: createInput });
      expect(created).toBeDefined();
      expect(created.name).toBe(createInput.name);

      // Read
      const read = resolvers.Query.planet(null, { id: String(created.id) });
      expect(read).toBeDefined();
      expect(read.name).toBe(createInput.name);

      // Update
      const updateInput = {
        id: String(created.id),
        name: 'Updated Integration Test Planet',
      };
      const updated = resolvers.Mutation.updatePlanet(null, { input: updateInput });
      expect(updated.name).toBe(updateInput.name);

      // Delete
      const deleted = resolvers.Mutation.deletePlanet(null, { id: String(created.id) });
      expect(deleted).toBe(true);

      // Verify deleted
      const verify = resolvers.Query.planet(null, { id: String(created.id) });
      expect(verify).toBeUndefined();
    });

    test('Create, Read, Update, Delete Character', () => {
      // Create
      const createInput = {
        name: 'Integration Test Character',
        species: 'Test Species',
        homePlanetId: 1,
      };
      const created = resolvers.Mutation.createCharacter(null, { input: createInput });
      expect(created).toBeDefined();
      expect(created.name).toBe(createInput.name);

      // Read
      const read = resolvers.Query.character(null, { id: String(created.id) });
      expect(read).toBeDefined();
      expect(read.name).toBe(createInput.name);

      // Update
      const updateInput = {
        id: String(created.id),
        name: 'Updated Integration Test Character',
      };
      const updated = resolvers.Mutation.updateCharacter(null, { input: updateInput });
      expect(updated.name).toBe(updateInput.name);

      // Delete
      const deleted = resolvers.Mutation.deleteCharacter(null, { id: String(created.id) });
      expect(deleted).toBe(true);
    });
  });

  describe('Nested Resolvers Integration', () => {
    test('Character with homePlanet and pilotedStarships', async () => {
      const loaders = createLoaders();
      const character = resolvers.Query.character(null, { id: '1' });
      
      if (character) {
        const homePlanet = await resolvers.Character.homePlanet(character, null, { loaders });
        const starships = await resolvers.Character.pilotedStarships(character, null, { loaders });
        
        expect(homePlanet).toBeDefined();
        expect(Array.isArray(starships)).toBe(true);
      }
    });

    test('Planet with residents', async () => {
      const loaders = createLoaders();
      const planet = resolvers.Query.planet(null, { id: '1' });
      
      if (planet) {
        const residents = await resolvers.Planet.residents(planet, null, { loaders });
        expect(Array.isArray(residents)).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    test('handles duplicate name error', () => {
      const input = {
        name: 'Tatooine', // Already exists from seed
        climate: 'Arid',
        terrain: 'Desert',
      };
      expect(() => {
        resolvers.Mutation.createPlanet(null, { input });
      }).toThrow();
    });

    test('handles not found error', () => {
      const input = {
        id: '9999',
        name: 'Non-existent',
      };
      expect(() => {
        resolvers.Mutation.updatePlanet(null, { input });
      }).toThrow();
    });
  });
});

