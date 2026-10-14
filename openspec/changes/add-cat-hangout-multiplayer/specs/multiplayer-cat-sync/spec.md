# Spec Delta

## Purpose

Keep the shared cat room responsive and consistent across browser clients and connection failures.

## ADDED Requirements

### Requirement: Authoritative room state
The server SHALL validate room capacity, identities, bot occupancy, movement bounds, and interaction outcomes before broadcasting room state.

#### Scenario: Invalid movement is submitted
- **WHEN** a client submits movement outside the valid world bounds
- **THEN** the server rejects or corrects that movement and broadcasts valid state

### Requirement: Smooth local and remote motion
The client SHALL respond immediately to local movement, reconcile authoritative corrections smoothly, and interpolate remote cats.

#### Scenario: Two clients move concurrently
- **WHEN** two connected players move at the same time
- **THEN** each sees its own cat respond immediately and the other cat move smoothly

### Requirement: Connection recovery feedback
The client SHALL show connecting, connected, full, disconnected, expired-room, and retryable error states when applicable.

#### Scenario: Connection is lost
- **WHEN** the active connection ends
- **THEN** the player sees a recovery state and can retry without a silent offline replacement
