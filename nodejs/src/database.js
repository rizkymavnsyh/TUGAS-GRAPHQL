import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', 'starwars.db');

export const db = new Database(DB_PATH);

db.pragma('foreign_keys = ON');

export function initDatabase() {
  console.log('Initializing database...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS planets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      climate TEXT,
      terrain TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      species TEXT,
      home_planet_id INTEGER,
      FOREIGN KEY (home_planet_id) REFERENCES planets (id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS starships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      model TEXT,
      manufacturer TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS character_starships (
      character_id INTEGER,
      starship_id INTEGER,
      PRIMARY KEY (character_id, starship_id),
      FOREIGN KEY (character_id) REFERENCES characters (id) ON DELETE CASCADE,
      FOREIGN KEY (starship_id) REFERENCES starships (id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      hashed_password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Database tables created successfully!');
}

export function getDb() {
  return db;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase();
  db.close();
}


