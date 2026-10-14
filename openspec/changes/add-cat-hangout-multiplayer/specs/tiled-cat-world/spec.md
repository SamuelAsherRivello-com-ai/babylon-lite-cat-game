# Spec Delta

## Purpose

Provide an editor-authored cat world whose maps and assets work locally in the game.

## ADDED Requirements

### Requirement: Tiled-compatible world data
The system SHALL load an orthogonal Tiled map with tile layers, collision or walkability, object layers, and custom properties for spawn points and activities.

#### Scenario: Edited map loads
- **WHEN** a valid map edited in Tiled is loaded
- **THEN** walkable areas, obstacles, spawns, and activity objects match its layer and object data

### Requirement: Map validation
The system SHALL reject invalid map data with an actionable initialization error instead of entering a partially playable room.

#### Scenario: Required collision data is absent
- **WHEN** the loaded map lacks required walkability or collision data
- **THEN** the game shows an error that identifies the missing map requirement

### Requirement: Local asset provenance
The system SHALL use project-local copies of approved CatMegaFree art and document each source and required attribution.

#### Scenario: Built game is loaded
- **WHEN** the published game loads its map or sprites
- **THEN** it does not read files from the original external asset folder

### Requirement: External tileset and animation contract
The system SHALL resolve project-local external TSX tilesets referenced by the map, validate their tile geometry and animated frame references, and drive CatMega character frames through a typed runtime animation catalog.

#### Scenario: Animated external tileset resolves
- **WHEN** a valid map references a TSX with animated tiles
- **THEN** the loader resolves the TSX relative to the map and selects the expected tile frame for elapsed time

#### Scenario: Packed character sheet is animated
- **WHEN** a cat changes between idle, walk, sleep, or box activity
- **THEN** its state selects a catalogued source rectangle and advances frames at the catalogued cadence without relying on a renderer position
