from aiodataloader import DataLoader
from .database import get_db_connection
import logging

logger = logging.getLogger("starwars_api.dataloaders")

class PlanetLoader(DataLoader):
    async def batch_load_fn(self, keys):
        try:
            conn = get_db_connection()
            try:
                placeholders = ','.join('?' * len(keys))
                query = f"SELECT id, name, climate, terrain FROM planets WHERE id IN ({placeholders})"
                planets = conn.execute(query, keys).fetchall()
                planet_dict = {str(p['id']): dict(p) for p in planets}
                result = [planet_dict.get(str(k)) for k in keys]
                logger.debug(f"PlanetLoader: Loaded {len([r for r in result if r])} planets for {len(keys)} keys")
                return result
            finally:
                conn.close()
        except Exception as e:
            logger.error(f"Error in PlanetLoader: {e}", exc_info=True)
            return [None] * len(keys)

class CharacterLoader(DataLoader):
    async def batch_load_fn(self, keys):
        try:
            conn = get_db_connection()
            try:
                placeholders = ','.join('?' * len(keys))
                query = f"SELECT id, name, species, home_planet_id FROM characters WHERE id IN ({placeholders})"
                characters = conn.execute(query, keys).fetchall()
                character_dict = {str(c['id']): dict(c) for c in characters}
                result = [character_dict.get(str(k)) for k in keys]
                logger.debug(f"CharacterLoader: Loaded {len([r for r in result if r])} characters for {len(keys)} keys")
                return result
            finally:
                conn.close()
        except Exception as e:
            logger.error(f"Error in CharacterLoader: {e}", exc_info=True)
            return [None] * len(keys)

class StarshipLoader(DataLoader):
    async def batch_load_fn(self, keys):
        try:
            conn = get_db_connection()
            try:
                placeholders = ','.join('?' * len(keys))
                query = f"SELECT id, name, model, manufacturer FROM starships WHERE id IN ({placeholders})"
                starships = conn.execute(query, keys).fetchall()
                starship_dict = {str(s['id']): dict(s) for s in starships}
                result = [starship_dict.get(str(k)) for k in keys]
                logger.debug(f"StarshipLoader: Loaded {len([r for r in result if r])} starships for {len(keys)} keys")
                return result
            finally:
                conn.close()
        except Exception as e:
            logger.error(f"Error in StarshipLoader: {e}", exc_info=True)
            return [None] * len(keys)

class CharacterStarshipsLoader(DataLoader):
    async def batch_load_fn(self, keys):
        try:
            conn = get_db_connection()
            try:
                placeholders = ','.join('?' * len(keys))
                query = f"""
                    SELECT cs.character_id, s.id, s.name, s.model, s.manufacturer
                    FROM character_starships cs
                    JOIN starships s ON cs.starship_id = s.id
                    WHERE cs.character_id IN ({placeholders})
                """
                results = conn.execute(query, keys).fetchall()
                
                starships_by_character = {}
                for row in results:
                    char_id = str(row['character_id'])
                    if char_id not in starships_by_character:
                        starships_by_character[char_id] = []
                    starships_by_character[char_id].append({
                        'id': row['id'],
                        'name': row['name'],
                        'model': row['model'],
                        'manufacturer': row['manufacturer']
                    })
                
                result = [starships_by_character.get(str(k), []) for k in keys]
                logger.debug(f"CharacterStarshipsLoader: Loaded starships for {len(keys)} characters")
                return result
            finally:
                conn.close()
        except Exception as e:
            logger.error(f"Error in CharacterStarshipsLoader: {e}", exc_info=True)
            return [[] for _ in keys]

class PlanetResidentsLoader(DataLoader):
    async def batch_load_fn(self, keys):
        try:
            conn = get_db_connection()
            try:
                placeholders = ','.join('?' * len(keys))
                query = f"""
                    SELECT home_planet_id, id, name, species, home_planet_id
                    FROM characters
                    WHERE home_planet_id IN ({placeholders})
                """
                results = conn.execute(query, keys).fetchall()
                
                residents_by_planet = {}
                for row in results:
                    planet_id = str(row['home_planet_id'])
                    if planet_id not in residents_by_planet:
                        residents_by_planet[planet_id] = []
                    residents_by_planet[planet_id].append({
                        'id': row['id'],
                        'name': row['name'],
                        'species': row['species'],
                        'home_planet_id': row['home_planet_id']
                    })
                
                result = [residents_by_planet.get(str(k), []) for k in keys]
                logger.debug(f"PlanetResidentsLoader: Loaded residents for {len(keys)} planets")
                return result
            finally:
                conn.close()
        except Exception as e:
            logger.error(f"Error in PlanetResidentsLoader: {e}", exc_info=True)
            return [[] for _ in keys]

class StarshipPilotsLoader(DataLoader):
    async def batch_load_fn(self, keys):
        try:
            conn = get_db_connection()
            try:
                placeholders = ','.join('?' * len(keys))
                query = f"""
                    SELECT cs.starship_id, c.id, c.name, c.species, c.home_planet_id
                    FROM character_starships cs
                    JOIN characters c ON cs.character_id = c.id
                    WHERE cs.starship_id IN ({placeholders})
                """
                results = conn.execute(query, keys).fetchall()
                
                pilots_by_starship = {}
                for row in results:
                    starship_id = str(row['starship_id'])
                    if starship_id not in pilots_by_starship:
                        pilots_by_starship[starship_id] = []
                    pilots_by_starship[starship_id].append({
                        'id': row['id'],
                        'name': row['name'],
                        'species': row['species'],
                        'home_planet_id': row['home_planet_id']
                    })
                
                result = [pilots_by_starship.get(str(k), []) for k in keys]
                logger.debug(f"StarshipPilotsLoader: Loaded pilots for {len(keys)} starships")
                return result
            finally:
                conn.close()
        except Exception as e:
            logger.error(f"Error in StarshipPilotsLoader: {e}", exc_info=True)
            return [[] for _ in keys]

