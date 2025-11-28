import pytest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.database import init_db, get_db_connection
from src.seed import seed_data
from src.resolvers import (
    resolve_all_characters, resolve_character,
    resolve_all_planets, resolve_planet,
    resolve_all_starships, resolve_starship
)

@pytest.fixture(scope="module")
def setup_database():
    init_db()
    seed_data()
    yield

@pytest.fixture
def mock_info():
    class MockInfo:
        def __init__(self):
            self.context = type('obj', (object,), {'dataloaders': {}})()
    return MockInfo()

def test_resolve_all_characters(setup_database, mock_info):
    result = resolve_all_characters(None, mock_info)
    assert isinstance(result, list)
    assert len(result) > 0
    assert 'name' in result[0]

def test_resolve_character(setup_database, mock_info):
    result = resolve_character(None, mock_info, "1")
    assert result is not None
    assert result['id'] == 1
    assert 'name' in result

def test_resolve_character_not_found(setup_database, mock_info):
    result = resolve_character(None, mock_info, "999")
    assert result is None

def test_resolve_all_planets(setup_database, mock_info):
    result = resolve_all_planets(None, mock_info)
    assert isinstance(result, list)
    assert len(result) > 0

def test_resolve_planet(setup_database, mock_info):
    result = resolve_planet(None, mock_info, "1")
    assert result is not None
    assert result['id'] == 1

def test_resolve_all_starships(setup_database, mock_info):
    result = resolve_all_starships(None, mock_info)
    assert isinstance(result, list)
    assert len(result) > 0

def test_resolve_starship(setup_database, mock_info):
    result = resolve_starship(None, mock_info, "1")
    assert result is not None
    assert result['id'] == 1

