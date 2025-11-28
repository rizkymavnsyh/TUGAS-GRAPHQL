import pytest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.validators import (
    CreatePlanetInput, UpdatePlanetInput,
    CreateCharacterInput, UpdateCharacterInput,
    CreateStarshipInput, UpdateStarshipInput
)

def test_create_planet_input_valid():
    input_data = CreatePlanetInput(
        name="Test Planet",
        climate="Temperate",
        terrain="Forest"
    )
    assert input_data.name == "Test Planet"
    assert input_data.climate == "Temperate"

def test_create_planet_input_empty_name():
    with pytest.raises(ValueError):
        CreatePlanetInput(name="", climate="Temperate")

def test_create_planet_input_name_too_long():
    with pytest.raises(ValueError):
        CreatePlanetInput(name="a" * 101, climate="Temperate")

def test_create_character_input_valid():
    input_data = CreateCharacterInput(
        name="Test Character",
        species="Human",
        homePlanetId=1
    )
    assert input_data.name == "Test Character"
    assert input_data.species == "Human"
    assert input_data.homePlanetId == 1

def test_create_character_input_invalid_planet_id():
    with pytest.raises(ValueError):
        CreateCharacterInput(
            name="Test",
            homePlanetId=-1
        )

def test_update_planet_input_partial():
    input_data = UpdatePlanetInput(
        id="1",
        name="Updated Name"
    )
    assert input_data.id == "1"
    assert input_data.name == "Updated Name"
    assert input_data.climate is None

def test_create_starship_input_valid():
    input_data = CreateStarshipInput(
        name="Test Ship",
        model="Test Model",
        manufacturer="Test Manufacturer"
    )
    assert input_data.name == "Test Ship"

