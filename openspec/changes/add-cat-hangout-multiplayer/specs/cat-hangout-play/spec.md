# Spec Delta

## Purpose

Let people control expressive cats in a calm shared space with no competitive outcome.

## ADDED Requirements

### Requirement: Player movement controls
The system SHALL move the local cat from WASD, arrow-key, or on-screen joystick input and SHALL provide Space and an on-screen action button for interaction.

#### Scenario: Keyboard movement
- **WHEN** a player holds an arrow key or WASD
- **THEN** only that player's cat moves in the requested direction

### Requirement: Stationary human animation
The system SHALL keep a human-controlled cat stationary without movement input and cycle it through non-moving idle animations.

#### Scenario: Human stops moving
- **WHEN** a human releases movement input
- **THEN** the cat remains in place and later selects an idle animation

### Requirement: Peaceful interactions
The system SHALL let a cat interact with nearby boxes, rest spots, food bowls, cat trees, or another cat without scores, damage, collection, victory, or failure.

#### Scenario: Box interaction
- **WHEN** a cat presses the action control beside a box
- **THEN** the cat enters or exits the box activity

### Requirement: Bot activity behavior
The system SHALL let bots select valid destinations, walk without blocking humans, perform a visible rest, box, food, tree, or social activity, then select another activity.

#### Scenario: Bot selects an activity
- **WHEN** a bot finishes an activity
- **THEN** it chooses a valid next activity and avoids repeating the same activity continuously
