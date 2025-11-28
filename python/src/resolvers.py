from ariadne import QueryType, MutationType, ObjectType
from .database import get_db_connection
from .auth import require_auth, require_admin, get_user_from_context
from .validators import (
    CreatePlanetInput, UpdatePlanetInput,
    CreateCharacterInput, UpdateCharacterInput,
    CreateStarshipInput, UpdateStarshipInput,
    AssignStarshipInput
)
from .dataloaders import (
    PlanetLoader, CharacterLoader, StarshipLoader,
    CharacterStarshipsLoader, PlanetResidentsLoader, StarshipPilotsLoader
)
import logging
import sqlite3

logger = logging.getLogger("starwars_api.resolvers")

def get_dataloaders(info):


    if not isinstance(info.context, dict):
        info.context = {}
    
    if 'dataloaders' not in info.context:
        info.context['dataloaders'] = {
            'planets': PlanetLoader(),
            'characters': CharacterLoader(),
            'starships': StarshipLoader(),
            'character_starships': CharacterStarshipsLoader(),
            'planet_residents': PlanetResidentsLoader(),
            'starship_pilots': StarshipPilotsLoader(),
        }
    return info.context['dataloaders']

query = QueryType()
mutation = MutationType()
character_type = ObjectType("Character")
planet_type = ObjectType("Planet")
starship_type = ObjectType("Starship")

@query.field("allCharacters")
def resolve_all_characters(_, info):
    logger.info("Fetching all characters")
    conn = get_db_connection()
    try:
        characters = conn.execute("SELECT id, name, species, home_planet_id FROM characters").fetchall()
        result = [dict(char) for char in characters]
        logger.info(f"Retrieved {len(result)} characters")
        return result
    except Exception as e:
        logger.error(f"Error fetching all characters: {e}", exc_info=True)
        raise
    finally:
        conn.close()

@query.field("character")
def resolve_character(_, info, id):
    logger.debug(f"Fetching character with ID: {id}")
    conn = get_db_connection()
    try:
        character = conn.execute("SELECT id, name, species, home_planet_id FROM characters WHERE id = ?", (id,)).fetchone()
        return dict(character) if character else None
    except Exception as e:
        logger.error(f"Error fetching character {id}: {e}", exc_info=True)
        raise
    finally:
        conn.close()

@query.field("allPlanets")
def resolve_all_planets(_, info):
    logger.info("Fetching all planets")
    conn = get_db_connection()
    try:
        planets = conn.execute("SELECT id, name, climate, terrain FROM planets").fetchall()
        return [dict(p) for p in planets]
    except Exception as e:
        logger.error(f"Error fetching all planets: {e}", exc_info=True)
        raise
    finally:
        conn.close()

@query.field("planet")
def resolve_planet(_, info, id):
    logger.debug(f"Fetching planet with ID: {id}")
    conn = get_db_connection()
    try:
        planet = conn.execute("SELECT id, name, climate, terrain FROM planets WHERE id = ?", (id,)).fetchone()
        return dict(planet) if planet else None
    except Exception as e:
        logger.error(f"Error fetching planet {id}: {e}", exc_info=True)
        raise
    finally:
        conn.close()

@query.field("allStarships")
def resolve_all_starships(_, info):
    logger.info("Fetching all starships")
    conn = get_db_connection()
    try:
        starships = conn.execute("SELECT id, name, model, manufacturer FROM starships").fetchall()
        return [dict(s) for s in starships]
    except Exception as e:
        logger.error(f"Error fetching all starships: {e}", exc_info=True)
        raise
    finally:
        conn.close()

@query.field("starship")
def resolve_starship(_, info, id):
    logger.debug(f"Fetching starship with ID: {id}")
    conn = get_db_connection()
    try:
        starship = conn.execute("SELECT id, name, model, manufacturer FROM starships WHERE id = ?", (id,)).fetchone()
        return dict(starship) if starship else None
    except Exception as e:
        logger.error(f"Error fetching starship {id}: {e}", exc_info=True)
        raise
    finally:
        conn.close()

@character_type.field("homePlanet")
async def resolve_character_home_planet(character_obj, info):
    home_planet_id = character_obj.get("home_planet_id")
    if not home_planet_id:
        return None
    try:
        dataloaders = get_dataloaders(info)
        planet = await dataloaders['planets'].load(int(home_planet_id))
        return planet
    except Exception as e:
        logger.error(f"Error loading home planet for character {character_obj.get('id')}: {e}", exc_info=True)
        return None

@character_type.field("pilotedStarships")
async def resolve_character_piloted_starships(character_obj, info):
    character_id = character_obj.get("id")
    if not character_id:
        return []
    try:
        dataloaders = get_dataloaders(info)
        starships = await dataloaders['character_starships'].load(int(character_id))
        return starships or []
    except Exception as e:
        logger.error(f"Error loading starships for character {character_id}: {e}", exc_info=True)
        return []

@planet_type.field("residents")
async def resolve_planet_residents(planet_obj, info):
    planet_id = planet_obj.get("id")
    if not planet_id:
        return []
    try:
        dataloaders = get_dataloaders(info)
        residents = await dataloaders['planet_residents'].load(int(planet_id))
        return residents or []
    except Exception as e:
        logger.error(f"Error loading residents for planet {planet_id}: {e}", exc_info=True)
        return []

@starship_type.field("pilots")
async def resolve_starship_pilots(starship_obj, info):
    starship_id = starship_obj.get("id")
    if not starship_id:
        return []
    try:
        dataloaders = get_dataloaders(info)
        pilots = await dataloaders['starship_pilots'].load(int(starship_id))
        return pilots or []
    except Exception as e:
        logger.error(f"Error loading pilots for starship {starship_id}: {e}", exc_info=True)
        return []

@mutation.field("createPlanet")
def resolve_create_planet(_, info, input):
    user = require_auth(info)
    logger.info(f"User {user.get('username')} creating planet: {input.get('name')}")
    
    try:
        validated = CreatePlanetInput(**input)
    except Exception as e:
        logger.warning(f"Validation error: {e}")
        raise Exception(f"Validation error: {str(e)}")
    
    conn = get_db_connection()
    try:
        conn.execute(
            "INSERT INTO planets (name, climate, terrain) VALUES (?, ?, ?)",
            (validated.name, validated.climate, validated.terrain),
        )
        conn.commit()
        planet_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        planet = conn.execute("SELECT id, name, climate, terrain FROM planets WHERE id = ?", (planet_id,)).fetchone()
        logger.info(f"Planet created successfully: {planet_id}")
        return dict(planet)
    except sqlite3.IntegrityError:
        conn.rollback()
        logger.warning(f"Duplicate planet name: {validated.name}")
        raise Exception(f"Planet '{validated.name}' sudah ada.")
    except Exception as e:
        logger.error(f"Error creating planet: {e}", exc_info=True)
        conn.rollback()
        raise
    finally:
        conn.close()

@mutation.field("updatePlanet")
def resolve_update_planet(_, info, input):
    user = require_auth(info)
    logger.info(f"User {user.get('username')} updating planet: {input.get('id')}")
    
    try:
        validated = UpdatePlanetInput(**input)
    except Exception as e:
        logger.warning(f"Validation error: {e}")
        raise Exception(f"Validation error: {str(e)}")
    
    conn = get_db_connection()
    try:
        planet = conn.execute("SELECT id, name, climate, terrain FROM planets WHERE id = ?", (validated.id,)).fetchone()
        if not planet:
            raise Exception(f"Planet dengan ID {validated.id} tidak ditemukan.")
        conn.execute(
            "UPDATE planets SET name = ?, climate = ?, terrain = ? WHERE id = ?",
            (
                validated.name if validated.name is not None else planet["name"],
                validated.climate if validated.climate is not None else planet["climate"],
                validated.terrain if validated.terrain is not None else planet["terrain"],
                validated.id,
            ),
        )
        conn.commit()
        updated_planet = conn.execute("SELECT id, name, climate, terrain FROM planets WHERE id = ?", (validated.id,)).fetchone()
        logger.info(f"Planet updated successfully: {validated.id}")
        return dict(updated_planet)
    except sqlite3.IntegrityError:
        conn.rollback()
        logger.warning(f"Duplicate planet name")
        raise Exception("Nama planet sudah digunakan.")
    except Exception as e:
        logger.error(f"Error updating planet: {e}", exc_info=True)
        conn.rollback()
        raise
    finally:
        conn.close()

@mutation.field("deletePlanet")
def resolve_delete_planet(_, info, id):
    user = require_admin(info)
    logger.warning(f"Admin {user.get('username')} deleting planet: {id}")
    
    conn = get_db_connection()
    try:
        planet = conn.execute("SELECT id FROM planets WHERE id = ?", (id,)).fetchone()
        if not planet:
            raise Exception(f"Planet dengan ID {id} tidak ditemukan.")
        residents = conn.execute("SELECT COUNT(*) FROM characters WHERE home_planet_id = ?", (id,)).fetchone()[0]
        if residents > 0:
            raise Exception(f"Tidak dapat menghapus planet dengan {residents} penduduk.")
        conn.execute("DELETE FROM planets WHERE id = ?", (id,))
        conn.commit()
        logger.info(f"Planet deleted successfully: {id}")
        return True
    except Exception as e:
        logger.error(f"Error deleting planet: {e}", exc_info=True)
        conn.rollback()
        raise
    finally:
        conn.close()

@mutation.field("createCharacter")
def resolve_create_character(_, info, input):
    user = require_auth(info)
    logger.info(f"User {user.get('username')} creating character: {input.get('name')}")
    
    try:
        validated = CreateCharacterInput(**input)
    except Exception as e:
        logger.warning(f"Validation error: {e}")
        raise Exception(f"Validation error: {str(e)}")
    
    conn = get_db_connection()
    try:
        if validated.homePlanetId:
            planet = conn.execute("SELECT id FROM planets WHERE id = ?", (validated.homePlanetId,)).fetchone()
            if not planet:
                raise Exception(f"Planet dengan ID {validated.homePlanetId} tidak ditemukan.")
        conn.execute(
            "INSERT INTO characters (name, species, home_planet_id) VALUES (?, ?, ?)",
            (validated.name, validated.species, validated.homePlanetId),
        )
        conn.commit()
        char_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        character = conn.execute(
            "SELECT id, name, species, home_planet_id FROM characters WHERE id = ?", (char_id,)
        ).fetchone()
        logger.info(f"Character created successfully: {char_id}")
        return dict(character)
    except sqlite3.IntegrityError:
        conn.rollback()
        logger.warning(f"Duplicate character name: {validated.name}")
        raise Exception(f"Karakter '{validated.name}' sudah ada.")
    except Exception as e:
        logger.error(f"Error creating character: {e}", exc_info=True)
        conn.rollback()
        raise
    finally:
        conn.close()

@mutation.field("updateCharacter")
def resolve_update_character(_, info, input):
    user = require_auth(info)
    logger.info(f"User {user.get('username')} updating character: {input.get('id')}")
    
    try:
        validated = UpdateCharacterInput(**input)
    except Exception as e:
        logger.warning(f"Validation error: {e}")
        raise Exception(f"Validation error: {str(e)}")
    
    conn = get_db_connection()
    try:
        character = conn.execute("SELECT id, name, species, home_planet_id FROM characters WHERE id = ?", (validated.id,)).fetchone()
        if not character:
            raise Exception(f"Karakter dengan ID {validated.id} tidak ditemukan.")
        
        if validated.homePlanetId:
            planet = conn.execute("SELECT id FROM planets WHERE id = ?", (validated.homePlanetId,)).fetchone()
            if not planet:
                raise Exception(f"Planet dengan ID {validated.homePlanetId} tidak ditemukan.")
        
        conn.execute(
            "UPDATE characters SET name = ?, species = ?, home_planet_id = ? WHERE id = ?",
            (
                validated.name if validated.name is not None else character["name"],
                validated.species if validated.species is not None else character["species"],
                validated.homePlanetId if validated.homePlanetId is not None else character["home_planet_id"],
                validated.id,
            ),
        )
        conn.commit()
        updated_character = conn.execute(
            "SELECT id, name, species, home_planet_id FROM characters WHERE id = ?", (validated.id,)
        ).fetchone()
        logger.info(f"Character updated successfully: {validated.id}")
        return dict(updated_character)
    except sqlite3.IntegrityError:
        conn.rollback()
        logger.warning(f"Duplicate character name")
        raise Exception("Nama karakter sudah digunakan.")
    except Exception as e:
        logger.error(f"Error updating character: {e}", exc_info=True)
        conn.rollback()
        raise
    finally:
        conn.close()

@mutation.field("deleteCharacter")
def resolve_delete_character(_, info, id):
    user = require_admin(info)
    logger.warning(f"Admin {user.get('username')} deleting character: {id}")
    
    conn = get_db_connection()
    try:
        character = conn.execute("SELECT id FROM characters WHERE id = ?", (id,)).fetchone()
        if not character:
            raise Exception(f"Karakter dengan ID {id} tidak ditemukan.")
        
        conn.execute("DELETE FROM character_starships WHERE character_id = ?", (id,))
        conn.execute("DELETE FROM characters WHERE id = ?", (id,))
        conn.commit()
        logger.info(f"Character deleted successfully: {id}")
        return True
    except Exception as e:
        logger.error(f"Error deleting character: {e}", exc_info=True)
        conn.rollback()
        raise
    finally:
        conn.close()

@mutation.field("createStarship")
def resolve_create_starship(_, info, input):
    user = require_auth(info)
    logger.info(f"User {user.get('username')} creating starship: {input.get('name')}")
    
    try:
        validated = CreateStarshipInput(**input)
    except Exception as e:
        logger.warning(f"Validation error: {e}")
        raise Exception(f"Validation error: {str(e)}")
    
    conn = get_db_connection()
    try:
        conn.execute(
            "INSERT INTO starships (name, model, manufacturer) VALUES (?, ?, ?)",
            (validated.name, validated.model, validated.manufacturer),
        )
        conn.commit()
        starship_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        starship = conn.execute(
            "SELECT id, name, model, manufacturer FROM starships WHERE id = ?", (starship_id,)
        ).fetchone()
        logger.info(f"Starship created successfully: {starship_id}")
        return dict(starship)
    except sqlite3.IntegrityError:
        conn.rollback()
        logger.warning(f"Duplicate starship name: {validated.name}")
        raise Exception(f"Kapal '{validated.name}' sudah ada.")
    except Exception as e:
        logger.error(f"Error creating starship: {e}", exc_info=True)
        conn.rollback()
        raise
    finally:
        conn.close()

@mutation.field("updateStarship")
def resolve_update_starship(_, info, input):
    user = require_auth(info)
    logger.info(f"User {user.get('username')} updating starship: {input.get('id')}")
    
    try:
        validated = UpdateStarshipInput(**input)
    except Exception as e:
        logger.warning(f"Validation error: {e}")
        raise Exception(f"Validation error: {str(e)}")
    
    conn = get_db_connection()
    try:
        starship = conn.execute("SELECT id, name, model, manufacturer FROM starships WHERE id = ?", (validated.id,)).fetchone()
        if not starship:
            raise Exception(f"Kapal dengan ID {validated.id} tidak ditemukan.")
        
        conn.execute(
            "UPDATE starships SET name = ?, model = ?, manufacturer = ? WHERE id = ?",
            (
                validated.name if validated.name is not None else starship["name"],
                validated.model if validated.model is not None else starship["model"],
                validated.manufacturer if validated.manufacturer is not None else starship["manufacturer"],
                validated.id,
            ),
        )
        conn.commit()
        updated_starship = conn.execute(
            "SELECT id, name, model, manufacturer FROM starships WHERE id = ?", (validated.id,)
        ).fetchone()
        logger.info(f"Starship updated successfully: {validated.id}")
        return dict(updated_starship)
    except sqlite3.IntegrityError:
        conn.rollback()
        logger.warning(f"Duplicate starship name")
        raise Exception("Nama kapal sudah digunakan.")
    except Exception as e:
        logger.error(f"Error updating starship: {e}", exc_info=True)
        conn.rollback()
        raise
    finally:
        conn.close()

@mutation.field("deleteStarship")
def resolve_delete_starship(_, info, id):
    user = require_admin(info)
    logger.warning(f"Admin {user.get('username')} deleting starship: {id}")
    
    conn = get_db_connection()
    try:
        starship = conn.execute("SELECT id FROM starships WHERE id = ?", (id,)).fetchone()
        if not starship:
            raise Exception(f"Kapal dengan ID {id} tidak ditemukan.")
        
        conn.execute("DELETE FROM character_starships WHERE starship_id = ?", (id,))
        conn.execute("DELETE FROM starships WHERE id = ?", (id,))
        conn.commit()
        logger.info(f"Starship deleted successfully: {id}")
        return True
    except Exception as e:
        logger.error(f"Error deleting starship: {e}", exc_info=True)
        conn.rollback()
        raise
    finally:
        conn.close()

@mutation.field("assignStarship")
def resolve_assign_starship(_, info, input):
    user = require_auth(info)
    logger.info(f"User {user.get('username')} assigning starship {input.get('starshipId')} to character {input.get('characterId')}")
    
    try:
        validated = AssignStarshipInput(**input)
    except Exception as e:
        logger.warning(f"Validation error: {e}")
        raise Exception(f"Validation error: {str(e)}")
    
    conn = get_db_connection()
    try:
        character = conn.execute("SELECT id FROM characters WHERE id = ?", (validated.characterId,)).fetchone()
        starship = conn.execute("SELECT id FROM starships WHERE id = ?", (validated.starshipId,)).fetchone()
        if not character:
            raise Exception(f"Karakter dengan ID {validated.characterId} tidak ditemukan.")
        if not starship:
            raise Exception(f"Kapal dengan ID {validated.starshipId} tidak ditemukan.")
        conn.execute(
            "INSERT OR IGNORE INTO character_starships (character_id, starship_id) VALUES (?, ?)",
            (validated.characterId, validated.starshipId),
        )
        conn.commit()
        character = conn.execute(
            "SELECT id, name, species, home_planet_id FROM characters WHERE id = ?",
            (validated.characterId,),
        ).fetchone()
        logger.info(f"Starship assigned successfully")
        return dict(character)
    except Exception as e:
        logger.error(f"Error assigning starship: {e}", exc_info=True)
        conn.rollback()
        raise
    finally:
        conn.close()

resolvers = [query, mutation, character_type, planet_type, starship_type]

