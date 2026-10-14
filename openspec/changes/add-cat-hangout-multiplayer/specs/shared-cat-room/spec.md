# Spec Delta

## Purpose

Provide a single welcoming room where up to twelve people can become cats together.

## ADDED Requirements

### Requirement: Automatic shared-room entry
The system SHALL place each visitor in the same available public room without requiring a room code or ready action.

#### Scenario: Visitor arrives
- **WHEN** a visitor opens the game
- **THEN** the game connects that visitor to the shared room or shows a retryable connection state

### Requirement: Human capacity and identity
The room SHALL accept up to twelve human players and assign each connected human a unique number, generated name, and distinct color.

#### Scenario: Roster is displayed
- **WHEN** a player is connected
- **THEN** the roster and in-world cat label show that player's number, name, and color

### Requirement: Minimum cat population
The room SHALL add bots only until four total cats are present, with no more than three bots, and SHALL remove unneeded bots as humans join.

#### Scenario: Single human joins
- **WHEN** one human is in the room
- **THEN** the room contains that human and three bot cats

#### Scenario: Fifth human joins
- **WHEN** five humans are connected
- **THEN** the room contains no bot cats
