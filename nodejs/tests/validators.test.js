import { describe, test, expect } from '@jest/globals';
import {
  validateInput,
  CreatePlanetInputSchema,
  CreateCharacterInputSchema,
  CreateStarshipInputSchema,
} from '../src/validators.js';
import { GraphQLError } from 'graphql';

describe('Validators', () => {
  describe('CreatePlanetInputSchema', () => {
    test('validates correct input', () => {
      const input = {
        name: 'Test Planet',
        climate: 'Temperate',
        terrain: 'Forest',
      };
      const result = validateInput(CreatePlanetInputSchema, input);
      expect(result.name).toBe(input.name);
    });

    test('throws error for empty name', () => {
      const input = {
        name: '',
        climate: 'Temperate',
      };
      expect(() => {
        validateInput(CreatePlanetInputSchema, input);
      }).toThrow(GraphQLError);
    });

    test('throws error for name too long', () => {
      const input = {
        name: 'a'.repeat(101),
        climate: 'Temperate',
      };
      expect(() => {
        validateInput(CreatePlanetInputSchema, input);
      }).toThrow(GraphQLError);
    });

    test('allows optional fields', () => {
      const input = {
        name: 'Test Planet',
      };
      const result = validateInput(CreatePlanetInputSchema, input);
      expect(result.name).toBe(input.name);
      expect(result.climate).toBeUndefined();
    });
  });

  describe('CreateCharacterInputSchema', () => {
    test('validates correct input', () => {
      const input = {
        name: 'Test Character',
        species: 'Human',
        homePlanetId: 1,
      };
      const result = validateInput(CreateCharacterInputSchema, input);
      expect(result.name).toBe(input.name);
      expect(result.species).toBe(input.species);
      expect(result.homePlanetId).toBe(input.homePlanetId);
    });

    test('throws error for empty name', () => {
      const input = {
        name: '',
        species: 'Human',
      };
      expect(() => {
        validateInput(CreateCharacterInputSchema, input);
      }).toThrow(GraphQLError);
    });

    test('throws error for negative homePlanetId', () => {
      const input = {
        name: 'Test Character',
        homePlanetId: -1,
      };
      expect(() => {
        validateInput(CreateCharacterInputSchema, input);
      }).toThrow(GraphQLError);
    });
  });

  describe('CreateStarshipInputSchema', () => {
    test('validates correct input', () => {
      const input = {
        name: 'Test Starship',
        model: 'Test Model',
        manufacturer: 'Test Manufacturer',
      };
      const result = validateInput(CreateStarshipInputSchema, input);
      expect(result.name).toBe(input.name);
    });

    test('throws error for empty name', () => {
      const input = {
        name: '',
        model: 'Test Model',
      };
      expect(() => {
        validateInput(CreateStarshipInputSchema, input);
      }).toThrow(GraphQLError);
    });
  });
});

