import { db } from './database.js';
import { GraphQLError } from 'graphql';
import { getLogger, logGraphQLError } from './logger.js';
import { requireAuth, requireAdmin } from './auth.js';
import {
  validateInput,
  CreatePlanetInputSchema,
  UpdatePlanetInputSchema,
  CreateCharacterInputSchema,
  UpdateCharacterInputSchema,
  CreateStarshipInputSchema,
  UpdateStarshipInputSchema,
  AssignStarshipInputSchema,
} from './validators.js';

const logger = getLogger('resolvers');

export const resolvers = {
  Query: {
    allCharacters: () => {
      try {
        const stmt = db.prepare('SELECT id, name, species, home_planet_id FROM characters');
        return stmt.all();
      } catch (error) {
        logGraphQLError(error, { operation: 'allCharacters' });
        throw error;
      }
    },

    character: (_, { id }) => {
      try {
        const stmt = db.prepare('SELECT id, name, species, home_planet_id FROM characters WHERE id = ?');
        return stmt.get(id);
      } catch (error) {
        logGraphQLError(error, { operation: 'character', id });
        throw error;
      }
    },

    allPlanets: () => {
      try {
        const stmt = db.prepare('SELECT id, name, climate, terrain FROM planets');
        return stmt.all();
      } catch (error) {
        logGraphQLError(error, { operation: 'allPlanets' });
        throw error;
      }
    },

    planet: (_, { id }) => {
      try {
        const stmt = db.prepare('SELECT id, name, climate, terrain FROM planets WHERE id = ?');
        return stmt.get(id);
      } catch (error) {
        logGraphQLError(error, { operation: 'planet', id });
        throw error;
      }
    },

    allStarships: () => {
      try {
        const stmt = db.prepare('SELECT id, name, model, manufacturer FROM starships');
        return stmt.all();
      } catch (error) {
        logGraphQLError(error, { operation: 'allStarships' });
        throw error;
      }
    },

    starship: (_, { id }) => {
      try {
        const stmt = db.prepare('SELECT id, name, model, manufacturer FROM starships WHERE id = ?');
        return stmt.get(id);
      } catch (error) {
        logGraphQLError(error, { operation: 'starship', id });
        throw error;
      }
    },
  },

  Mutation: {
    createPlanet: (_, { input }, { req }) => {
      try {
        requireAuth(req);
        const validated = validateInput(CreatePlanetInputSchema, input);

        const stmt = db.prepare('INSERT INTO planets (name, climate, terrain) VALUES (?, ?, ?)');
        const result = stmt.run(validated.name, validated.climate || null, validated.terrain || null);
        
        const newPlanet = db.prepare('SELECT id, name, climate, terrain FROM planets WHERE id = ?').get(result.lastInsertRowid);
        logger.info('Planet created', { id: newPlanet.id, name: newPlanet.name });
        return newPlanet;
      } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
          throw new GraphQLError(`Planet '${input.name}' sudah ada.`, {
            extensions: { code: 'DUPLICATE_ERROR' },
          });
        }
        logGraphQLError(error, { operation: 'createPlanet', input });
        throw error;
      }
    },

    updatePlanet: (_, { input }, { req }) => {
      try {
        requireAuth(req);
        const validated = validateInput(UpdatePlanetInputSchema, input);

        const planet = db.prepare('SELECT id, name, climate, terrain FROM planets WHERE id = ?').get(validated.id);
        if (!planet) {
          throw new GraphQLError(`Planet dengan ID ${validated.id} tidak ditemukan.`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        const stmt = db.prepare('UPDATE planets SET name = ?, climate = ?, terrain = ? WHERE id = ?');
        stmt.run(
          validated.name ?? planet.name,
          validated.climate ?? planet.climate,
          validated.terrain ?? planet.terrain,
          validated.id
        );

        const updatedPlanet = db.prepare('SELECT id, name, climate, terrain FROM planets WHERE id = ?').get(validated.id);
        logger.info('Planet updated', { id: updatedPlanet.id });
        return updatedPlanet;
      } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
          throw new GraphQLError('Nama planet sudah digunakan.', {
            extensions: { code: 'DUPLICATE_ERROR' },
          });
        }
        logGraphQLError(error, { operation: 'updatePlanet', input });
        throw error;
      }
    },

    deletePlanet: (_, { id }, { req }) => {
      try {
        requireAdmin(req);
        const planet = db.prepare('SELECT id FROM planets WHERE id = ?').get(id);
        if (!planet) {
          throw new GraphQLError(`Planet dengan ID ${id} tidak ditemukan.`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        const residents = db.prepare('SELECT COUNT(*) as count FROM characters WHERE home_planet_id = ?').get(id);
        if (residents.count > 0) {
          throw new GraphQLError(`Tidak dapat menghapus planet dengan ${residents.count} penduduk.`, {
            extensions: { code: 'CONSTRAINT_ERROR' },
          });
        }

        db.prepare('DELETE FROM planets WHERE id = ?').run(id);
        logger.info('Planet deleted', { id });
        return true;
      } catch (error) {
        logGraphQLError(error, { operation: 'deletePlanet', id });
        throw error;
      }
    },

    createCharacter: (_, { input }, { req }) => {
      try {
        requireAuth(req);
        const validated = validateInput(CreateCharacterInputSchema, input);

        if (validated.homePlanetId) {
          const planet = db.prepare('SELECT id FROM planets WHERE id = ?').get(validated.homePlanetId);
          if (!planet) {
            throw new GraphQLError(`Planet dengan ID ${validated.homePlanetId} tidak ditemukan.`, {
              extensions: { code: 'NOT_FOUND' },
            });
          }
        }

        const stmt = db.prepare('INSERT INTO characters (name, species, home_planet_id) VALUES (?, ?, ?)');
        const result = stmt.run(validated.name, validated.species || null, validated.homePlanetId || null);

        const newCharacter = db.prepare('SELECT id, name, species, home_planet_id FROM characters WHERE id = ?').get(result.lastInsertRowid);
        logger.info('Character created', { id: newCharacter.id, name: newCharacter.name });
        return newCharacter;
      } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
          throw new GraphQLError(`Karakter '${input.name}' sudah ada.`, {
            extensions: { code: 'DUPLICATE_ERROR' },
          });
        }
        logGraphQLError(error, { operation: 'createCharacter', input });
        throw error;
      }
    },

    updateCharacter: (_, { input }, { req }) => {
      try {
        requireAuth(req);
        const validated = validateInput(UpdateCharacterInputSchema, input);

        const character = db.prepare('SELECT id, name, species, home_planet_id FROM characters WHERE id = ?').get(validated.id);
        if (!character) {
          throw new GraphQLError(`Karakter dengan ID ${validated.id} tidak ditemukan.`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        if (validated.homePlanetId) {
          const planet = db.prepare('SELECT id FROM planets WHERE id = ?').get(validated.homePlanetId);
          if (!planet) {
            throw new GraphQLError(`Planet dengan ID ${validated.homePlanetId} tidak ditemukan.`, {
              extensions: { code: 'NOT_FOUND' },
            });
          }
        }

        const stmt = db.prepare('UPDATE characters SET name = ?, species = ?, home_planet_id = ? WHERE id = ?');
        stmt.run(
          validated.name ?? character.name,
          validated.species ?? character.species,
          validated.homePlanetId ?? character.home_planet_id,
          validated.id
        );

        const updatedCharacter = db.prepare('SELECT id, name, species, home_planet_id FROM characters WHERE id = ?').get(validated.id);
        logger.info('Character updated', { id: updatedCharacter.id });
        return updatedCharacter;
      } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
          throw new GraphQLError('Nama karakter sudah digunakan.', {
            extensions: { code: 'DUPLICATE_ERROR' },
          });
        }
        logGraphQLError(error, { operation: 'updateCharacter', input });
        throw error;
      }
    },

    deleteCharacter: (_, { id }, { req }) => {
      try {
        requireAdmin(req);
        const character = db.prepare('SELECT id FROM characters WHERE id = ?').get(id);
        if (!character) {
          throw new GraphQLError(`Karakter dengan ID ${id} tidak ditemukan.`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        db.prepare('DELETE FROM character_starships WHERE character_id = ?').run(id);
        db.prepare('DELETE FROM characters WHERE id = ?').run(id);
        logger.info('Character deleted', { id });
        return true;
      } catch (error) {
        logGraphQLError(error, { operation: 'deleteCharacter', id });
        throw error;
      }
    },

    createStarship: (_, { input }, { req }) => {
      try {
        requireAuth(req);
        const validated = validateInput(CreateStarshipInputSchema, input);

        const stmt = db.prepare('INSERT INTO starships (name, model, manufacturer) VALUES (?, ?, ?)');
        const result = stmt.run(validated.name, validated.model || null, validated.manufacturer || null);

        const newStarship = db.prepare('SELECT id, name, model, manufacturer FROM starships WHERE id = ?').get(result.lastInsertRowid);
        logger.info('Starship created', { id: newStarship.id, name: newStarship.name });
        return newStarship;
      } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
          throw new GraphQLError(`Kapal '${input.name}' sudah ada.`, {
            extensions: { code: 'DUPLICATE_ERROR' },
          });
        }
        logGraphQLError(error, { operation: 'createStarship', input });
        throw error;
      }
    },

    updateStarship: (_, { input }, { req }) => {
      try {
        requireAuth(req);
        const validated = validateInput(UpdateStarshipInputSchema, input);

        const starship = db.prepare('SELECT id, name, model, manufacturer FROM starships WHERE id = ?').get(validated.id);
        if (!starship) {
          throw new GraphQLError(`Kapal dengan ID ${validated.id} tidak ditemukan.`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        const stmt = db.prepare('UPDATE starships SET name = ?, model = ?, manufacturer = ? WHERE id = ?');
        stmt.run(
          validated.name ?? starship.name,
          validated.model ?? starship.model,
          validated.manufacturer ?? starship.manufacturer,
          validated.id
        );

        const updatedStarship = db.prepare('SELECT id, name, model, manufacturer FROM starships WHERE id = ?').get(validated.id);
        logger.info('Starship updated', { id: updatedStarship.id });
        return updatedStarship;
      } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
          throw new GraphQLError('Nama kapal sudah digunakan.', {
            extensions: { code: 'DUPLICATE_ERROR' },
          });
        }
        logGraphQLError(error, { operation: 'updateStarship', input });
        throw error;
      }
    },

    deleteStarship: (_, { id }, { req }) => {
      try {
        requireAdmin(req);
        const starship = db.prepare('SELECT id FROM starships WHERE id = ?').get(id);
        if (!starship) {
          throw new GraphQLError(`Kapal dengan ID ${id} tidak ditemukan.`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        db.prepare('DELETE FROM character_starships WHERE starship_id = ?').run(id);
        db.prepare('DELETE FROM starships WHERE id = ?').run(id);
        logger.info('Starship deleted', { id });
        return true;
      } catch (error) {
        logGraphQLError(error, { operation: 'deleteStarship', id });
        throw error;
      }
    },

    assignStarship: (_, { input }, { req }) => {
      try {
        requireAuth(req);
        const validated = validateInput(AssignStarshipInputSchema, input);

        const character = db.prepare('SELECT id FROM characters WHERE id = ?').get(validated.characterId);
        const starship = db.prepare('SELECT id FROM starships WHERE id = ?').get(validated.starshipId);

        if (!character) {
          throw new GraphQLError(`Karakter dengan ID ${validated.characterId} tidak ditemukan.`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        if (!starship) {
          throw new GraphQLError(`Kapal dengan ID ${validated.starshipId} tidak ditemukan.`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        try {
          const stmt = db.prepare('INSERT INTO character_starships (character_id, starship_id) VALUES (?, ?)');
          stmt.run(validated.characterId, validated.starshipId);
          logger.info('Starship assigned', { characterId: validated.characterId, starshipId: validated.starshipId });
        } catch (error) {
          if (error.code !== 'SQLITE_CONSTRAINT') {
            throw error;
          }
        }

        const updatedCharacter = db.prepare('SELECT id, name, species, home_planet_id FROM characters WHERE id = ?').get(validated.characterId);
        return updatedCharacter;
      } catch (error) {
        logGraphQLError(error, { operation: 'assignStarship', input });
        throw error;
      }
    },
  },

  Character: {
    homePlanet: (character, _, { loaders }) => {
      if (!character.home_planet_id) return null;
      return loaders.planet.load(character.home_planet_id);
    },

    pilotedStarships: (character, _, { loaders }) => {
      return loaders.characterStarships.load(character.id);
    },
  },

  Planet: {
    residents: (planet, _, { loaders }) => {
      return loaders.planetResidents.load(planet.id);
    },
  },

  Starship: {
    pilots: (starship, _, { loaders }) => {
      return loaders.starshipPilots.load(starship.id);
    },
  },
};
