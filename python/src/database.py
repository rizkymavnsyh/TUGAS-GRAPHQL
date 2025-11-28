import sqlite3
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
DATABASE_NAME = os.path.join(PROJECT_ROOT, "starwars.db")

def get_db_connection():
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS planets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            climate TEXT,
            terrain TEXT
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS characters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            species TEXT,
            home_planet_id INTEGER,
            FOREIGN KEY (home_planet_id) REFERENCES planets (id)
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS starships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            model TEXT,
            manufacturer TEXT
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS character_starships (
            character_id INTEGER,
            starship_id INTEGER,
            PRIMARY KEY (character_id, starship_id),
            FOREIGN KEY (character_id) REFERENCES characters (id) ON DELETE CASCADE,
            FOREIGN KEY (starship_id) REFERENCES starships (id) ON DELETE CASCADE
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    c.execute("CREATE INDEX IF NOT EXISTS idx_characters_home_planet ON characters(home_planet_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_character_starships_character ON character_starships(character_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_character_starships_starship ON character_starships(starship_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(name)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_starships_name ON starships(name)")

    conn.commit()
    conn.close()
    print("✅ Database tables created successfully!")

if __name__ == "__main__":
    init_db()

