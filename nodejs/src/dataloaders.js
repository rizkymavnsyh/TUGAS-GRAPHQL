import DataLoader from 'dataloader';
import { db } from './database.js';

export function createPlanetLoader() {
  return new DataLoader(async (ids) => {
    if (ids.length === 0) return [];
    
    const placeholders = ids.map(() => '?').join(',');
    const planets = db.prepare(
      `SELECT id, name, climate, terrain FROM planets WHERE id IN (${placeholders})`
    ).all(ids);
    
    const planetMap = new Map(planets.map(p => [p.id, p]));
    return ids.map(id => planetMap.get(id) || null);
  });
}

export function createCharacterLoader() {
  return new DataLoader(async (ids) => {
    if (ids.length === 0) return [];
    
    const placeholders = ids.map(() => '?').join(',');
    const characters = db.prepare(
      `SELECT id, name, species, home_planet_id FROM characters WHERE id IN (${placeholders})`
    ).all(ids);
    
    const characterMap = new Map(characters.map(c => [c.id, c]));
    return ids.map(id => characterMap.get(id) || null);
  });
}

export function createStarshipLoader() {
  return new DataLoader(async (ids) => {
    if (ids.length === 0) return [];
    
    const placeholders = ids.map(() => '?').join(',');
    const starships = db.prepare(
      `SELECT id, name, model, manufacturer FROM starships WHERE id IN (${placeholders})`
    ).all(ids);
    
    const starshipMap = new Map(starships.map(s => [s.id, s]));
    return ids.map(id => starshipMap.get(id) || null);
  });
}

export function createCharacterStarshipsLoader() {
  return new DataLoader(async (characterIds) => {
    if (characterIds.length === 0) return [];
    
    const placeholders = characterIds.map(() => '?').join(',');
    const results = db.prepare(`
      SELECT cs.character_id, s.id, s.name, s.model, s.manufacturer
      FROM character_starships cs
      JOIN starships s ON cs.starship_id = s.id
      WHERE cs.character_id IN (${placeholders})
    `).all(characterIds);
    
    const starshipsByCharacter = new Map();
    characterIds.forEach(id => starshipsByCharacter.set(id, []));
    
    results.forEach(row => {
      const starship = {
        id: row.id,
        name: row.name,
        model: row.model,
        manufacturer: row.manufacturer,
      };
      const existing = starshipsByCharacter.get(row.character_id) || [];
      existing.push(starship);
      starshipsByCharacter.set(row.character_id, existing);
    });
    
    return characterIds.map(id => starshipsByCharacter.get(id) || []);
  });
}

export function createPlanetResidentsLoader() {
  return new DataLoader(async (planetIds) => {
    if (planetIds.length === 0) return [];
    
    const placeholders = planetIds.map(() => '?').join(',');
    const results = db.prepare(`
      SELECT id, name, species, home_planet_id
      FROM characters
      WHERE home_planet_id IN (${placeholders})
    `).all(planetIds);
    
    const residentsByPlanet = new Map();
    planetIds.forEach(id => residentsByPlanet.set(id, []));
    
    results.forEach(character => {
      const existing = residentsByPlanet.get(character.home_planet_id) || [];
      existing.push(character);
      residentsByPlanet.set(character.home_planet_id, existing);
    });
    
    return planetIds.map(id => residentsByPlanet.get(id) || []);
  });
}

export function createStarshipPilotsLoader() {
  return new DataLoader(async (starshipIds) => {
    if (starshipIds.length === 0) return [];
    
    const placeholders = starshipIds.map(() => '?').join(',');
    const results = db.prepare(`
      SELECT cs.starship_id, c.id, c.name, c.species, c.home_planet_id
      FROM character_starships cs
      JOIN characters c ON cs.character_id = c.id
      WHERE cs.starship_id IN (${placeholders})
    `).all(starshipIds);
    
    const pilotsByStarship = new Map();
    starshipIds.forEach(id => pilotsByStarship.set(id, []));
    
    results.forEach(row => {
      const character = {
        id: row.id,
        name: row.name,
        species: row.species,
        home_planet_id: row.home_planet_id,
      };
      const existing = pilotsByStarship.get(row.starship_id) || [];
      existing.push(character);
      pilotsByStarship.set(row.starship_id, existing);
    });
    
    return starshipIds.map(id => pilotsByStarship.get(id) || []);
  });
}

export function createLoaders() {
  return {
    planet: createPlanetLoader(),
    character: createCharacterLoader(),
    starship: createStarshipLoader(),
    characterStarships: createCharacterStarshipsLoader(),
    planetResidents: createPlanetResidentsLoader(),
    starshipPilots: createStarshipPilotsLoader(),
  };
}

