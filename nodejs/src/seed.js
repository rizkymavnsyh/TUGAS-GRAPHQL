import { db, initDatabase } from './database.js';

export function seedData() {
  console.log('Seeding database with Star Wars data...');

  db.exec('DELETE FROM character_starships');
  db.exec('DELETE FROM characters');
  db.exec('DELETE FROM starships');
  db.exec('DELETE FROM planets');

  const insertPlanet = db.prepare('INSERT INTO planets (name, climate, terrain) VALUES (?, ?, ?)');
  const planets = [
    ['Tatooine', 'Arid', 'Desert'],
    ['Alderaan', 'Temperate', 'Grasslands, Mountains'],
    ['Yavin IV', 'Temperate, Humid', 'Jungle, Rainforests'],
    ['Naboo', 'Temperate', 'Grassy Hills, Swamps'],
    ['Coruscant', 'Temperate', 'Cityscape'],
  ];

  for (const planet of planets) {
    insertPlanet.run(planet);
  }

  const planetsData = db.prepare('SELECT id, name FROM planets').all();
  const planetIds = {};
  planetsData.forEach(p => {
    planetIds[p.name] = p.id;
  });

  const insertCharacter = db.prepare('INSERT INTO characters (name, species, home_planet_id) VALUES (?, ?, ?)');
  const characters = [
    ['Luke Skywalker', 'Human', planetIds['Tatooine']],
    ['Leia Organa', 'Human', planetIds['Alderaan']],
    ['Han Solo', 'Human', null],
    ['C-3PO', 'Droid', null],
    ['Yoda', 'Unknown', null],
  ];

  for (const character of characters) {
    insertCharacter.run(character);
  }

  const charactersData = db.prepare('SELECT id, name FROM characters').all();
  const characterIds = {};
  charactersData.forEach(c => {
    characterIds[c.name] = c.id;
  });

  const insertStarship = db.prepare('INSERT INTO starships (name, model, manufacturer) VALUES (?, ?, ?)');
  const starships = [
    ['Millennium Falcon', 'YT-1300 light freighter', 'Corellian Engineering'],
    ['X-wing', 'T-65 X-wing starfighter', 'Incom Corporation'],
    ['TIE Fighter', 'TIE/LN starfighter', 'Sienar Fleet Systems'],
  ];

  for (const starship of starships) {
    insertStarship.run(starship);
  }

  const starshipsData = db.prepare('SELECT id, name FROM starships').all();
  const starshipIds = {};
  starshipsData.forEach(s => {
    starshipIds[s.name] = s.id;
  });

  const insertCharacterStarship = db.prepare('INSERT INTO character_starships (character_id, starship_id) VALUES (?, ?)');
  const characterStarships = [
    [characterIds['Han Solo'], starshipIds['Millennium Falcon']],
    [characterIds['Luke Skywalker'], starshipIds['X-wing']],
  ];

  for (const cs of characterStarships) {
    insertCharacterStarship.run(cs);
  }

  console.log('✅ Database seeded successfully with Star Wars data!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase();
  seedData();
  db.close();
}


