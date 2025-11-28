import { z } from 'zod';
import { GraphQLError } from 'graphql';

export const CreatePlanetInputSchema = z.object({
  name: z.string().min(1, 'Nama planet tidak boleh kosong').max(100, 'Nama planet maksimal 100 karakter'),
  climate: z.string().max(50, 'Climate maksimal 50 karakter').optional().nullable(),
  terrain: z.string().max(100, 'Terrain maksimal 100 karakter').optional().nullable(),
});

export const UpdatePlanetInputSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(val => String(val)),
  name: z.string().min(1, 'Nama planet tidak boleh kosong').max(100, 'Nama planet maksimal 100 karakter').optional(),
  climate: z.string().max(50, 'Climate maksimal 50 karakter').optional().nullable(),
  terrain: z.string().max(100, 'Terrain maksimal 100 karakter').optional().nullable(),
});

export const CreateCharacterInputSchema = z.object({
  name: z.string().min(1, 'Nama karakter tidak boleh kosong').max(100, 'Nama karakter maksimal 100 karakter'),
  species: z.string().max(50, 'Species maksimal 50 karakter').optional().nullable(),
  homePlanetId: z.number().int().positive('homePlanetId harus bilangan bulat positif').optional().nullable(),
});

export const UpdateCharacterInputSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(val => String(val)),
  name: z.string().min(1, 'Nama karakter tidak boleh kosong').max(100, 'Nama karakter maksimal 100 karakter').optional(),
  species: z.string().max(50, 'Species maksimal 50 karakter').optional().nullable(),
  homePlanetId: z.number().int().positive('homePlanetId harus bilangan bulat positif').optional().nullable(),
});

export const CreateStarshipInputSchema = z.object({
  name: z.string().min(1, 'Nama kapal tidak boleh kosong').max(100, 'Nama kapal maksimal 100 karakter'),
  model: z.string().max(100, 'Model maksimal 100 karakter').optional().nullable(),
  manufacturer: z.string().max(100, 'Manufacturer maksimal 100 karakter').optional().nullable(),
});

export const UpdateStarshipInputSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(val => String(val)),
  name: z.string().min(1, 'Nama kapal tidak boleh kosong').max(100, 'Nama kapal maksimal 100 karakter').optional(),
  model: z.string().max(100, 'Model maksimal 100 karakter').optional().nullable(),
  manufacturer: z.string().max(100, 'Manufacturer maksimal 100 karakter').optional().nullable(),
});

export const AssignStarshipInputSchema = z.object({
  characterId: z.union([z.string(), z.number()]).transform(val => String(val)),
  starshipId: z.union([z.string(), z.number()]).transform(val => String(val)),
});

export function validateInput(schema, input) {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new GraphQLError(`Validation error: ${messages}`, {
        extensions: {
          code: 'VALIDATION_ERROR',
          errors: error.errors,
        },
      });
    }
    throw error;
  }
}

