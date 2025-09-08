# Flingoos Shared Models (Python)

Generated Pydantic v2 models from @flingoos/shared JSON schemas. Provides runtime validation for all Flingoos service contracts.

## Installation

```bash
# Install from git with pinned commit/tag
pip install git+ssh://git@github.com/flingoos/flingoos-shared.git@<SHA>#subdirectory=python/flingoos_shared_models
```

## Usage

```python
from flingoos_shared_models import SessionStartResponse, BridgeCommandRequest

# Validate Session Manager response
response_data = {"success": True, "session_id": "uuid", "status": "recording"}
response = SessionStartResponse.model_validate(response_data)
print(response.session_id)

# Validate Bridge command
command_data = {"command": "audio_start", "timestamp": 1642271400.123}
command = BridgeCommandRequest.model_validate(command_data)
print(command.command)
```

## Generated Models

### Session Manager
- `SessionStartResponse` - Session start API response
- `SessionStopResponse` - Session stop API response  
- `SessionStatusResponse` - Session status API response
- `SessionInternalState` - Internal session state

### Bridge Service
- `BridgeCommandRequest` - Bridge command request payload
- `BridgeCommandResponse` - Bridge command response payload

### Forge Pipeline
- `ForgeJobResponse` - Complete Forge processing response
- `ForgeManifest` - Forge execution manifest
- `StageExecution` - Individual pipeline stage execution
- `ForgeArtifact` - Forge output artifact metadata
- `ForgeCounters` - Processing statistics

### Progress & UI
- `JobProgress` - Job progress calculation
- `ForgeTrigger` - Forge trigger payload
- `SessionEvent` - WebSocket session events
- `FirestoreWorkflow` - Firestore workflow document

### Error Handling
- `StandardErrorResponse` - Standard error format
- `ErrorEnvelope` - Structured error envelope

## Validation

All models include Pydantic v2 validation:
- Type checking
- Enum validation  
- Required field validation
- Format validation (e.g., datetime, UUID)

```python
try:
    response = SessionStartResponse.model_validate(data)
except ValidationError as e:
    print(f"Validation failed: {e}")
```

## Schema Source

Generated from JSON schemas at: https://schemas.flingoos.com/shared/v0.1.0/
