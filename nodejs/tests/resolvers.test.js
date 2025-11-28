import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { resolvers } from '../src/resolvers.js';
import { initDatabase, db } from '../src/database.js';
import { seedData } from '../src/seed.js';
import { createLoaders } from '../src/dataloaders.js';

describe('Resolvers', () => {
  beforeAll(() => {
    initDatabase();
    seedData();
  });

  afterAll(() => {
    db.close();
  });

  describe('Query Resolvers', () => {
    test('allCharacters returns array', () => {
      const result = resolvers.Query.allCharacters();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    test('character returns character by id', () => {
      const result = resolvers.Query.character(null, { id: '1' });
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBeDefined();
    });

    test('character returns null for non-existent id', () => {
      const result = resolvers.Query.character(null, { id: '9999' });
      expect(result).toBeUndefined();
    });

    test('allPlanets returns array', () => {
      const result = resolvers.Query.allPlanets();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    test('planet returns planet by id', () => {
      const result = resolvers.Query.planet(null, { id: '1' });
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBeDefined();
    });

    test('allStarships returns array', () => {
      const result = resolvers.Query.allStarships();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Mutation Resolvers', () => {
    test('createPlanet creates new planet', () => {
      const input = {
        name: 'Test Planet',
        climate: 'Temperate',
        terrain: 'Forest',
      };
      const result = resolvers.Mutation.createPlanet(null, { input });
      expect(result).toBeDefined();
      expect(result.name).toBe(input.name);
      expect(result.climate).toBe(input.climate);
      expect(result.terrain).toBe(input.terrain);
    });

    test('createPlanet throws error for duplicate name', () => {
      const input = {
        name: 'Tatooine',
        climate: 'Arid',
        terrain: 'Desert',
      };
      expect(() => {
        resolvers.Mutation.createPlanet(null, { input });
      }).toThrow();
    });

    test('updatePlanet updates planet', () => {
      // Create a planet first
      const createInput = {
        name: 'Update Test Planet',
        climate: 'Cold',
        terrain: 'Ice',
      };
      const created = resolvers.Mutation.createPlanet(null, { input: createInput });

      // Update it
      const updateInput = {
        id: String(created.id),
        name: 'Updated Planet Name',
      };
      const result = resolvers.Mutation.updatePlanet(null, { input: updateInput });
      expect(result.name).toBe(updateInput.name);
    });

    test('createCharacter creates new character', () => {
      const input = {
        name: 'Test Character',
        species: 'Human',
        homePlanetId: 1,
      };
      const result = resolvers.Mutation.createCharacter(null, { input });
      expect(result).toBeDefined();
      expect(result.name).toBe(input.name);
      expect(result.species).toBe(input.species);
    });

    test('createStarship creates new starship', () => {
      const input = {
        name: 'Test Starship',
        model: 'Test Model',
        manufacturer: 'Test Manufacturer',
      };
      const result = resolvers.Mutation.createStarship(null, { input });
      expect(result).toBeDefined();
      expect(result.name).toBe(input.name);
    });
  });

  describe('Nested Resolvers with DataLoader', () => {
    test('Character.homePlanet uses DataLoader', async () => {
      const loaders = createLoaders();
      const character = { id: 1, name: 'Luke', home_planet_id: 1 };
      
      const result = await resolvers.Character.homePlanet(character, null, { loaders });
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    test('Character.pilotedStarships uses DataLoader', async () => {
      const loaders = createLoaders();
      const character = { id: 1, name: 'Luke' };
      
      const result = await resolvers.Character.pilotedStarships(character, null, { loaders });
      expect(Array.isArray(result)).toBe(true);
    });

    test('Planet.residents uses DataLoader', async () => {
      const loaders = createLoaders();
      const planet = { id: 1, name: 'Tatooine' };
      
      const result = await resolvers.Planet.residents(planet, null, { loaders });
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

