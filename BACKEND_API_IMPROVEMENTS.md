# Backend API Improvements for Admin Dashboard

## Summary

The admin dashboard in the frontend requires properly typed API endpoints for sessions and agent connection management. Currently, the debug endpoints return empty schemas, which makes it difficult to work with the data in a type-safe manner and requires custom type definitions in the frontend.

## Current Issues

### 1. Empty Response Schemas for Debug Endpoints

The following endpoints currently have empty schemas in the OpenAPI specification:

- `GET /debug/sessions` - Returns `schema: {}`
- `GET /debug/agent-connections` - Returns `schema: {}`
- `GET /debug/connection-stats` - Returns `schema: {}`

**Impact:**

- No TypeScript type generation for these endpoints
- Frontend requires manual type definitions
- No API documentation for response structure
- Difficult to validate data consistency
- Mock data generation is not possible without custom handlers

### 2. Missing Historical Sessions Endpoint

**Current State:**

- Only `GET /debug/sessions` exists, which returns active sessions

**Needed:**

- `GET /sessions` or `GET /sessions/history` - Returns all sessions (active and historical)
- Should include pagination support
- Should include filtering by status (active, completed, failed, etc.)
- Should include date range filtering

**Use Case:**
The admin dashboard needs to display both active and past sessions to provide a complete overview of system activity.

### 3. Missing Aggregated Acquisition Metrics

**Current State:**

- `GET /acquisitions` returns basic acquisition info (uuid, name, status, start_time, end_time)
- No aggregated statistics about acquisitions

**Needed:**
Add the following fields to `AcquisitionResponse` or create a new endpoint `GET /acquisitions/{uuid}/stats`:

- `total_grids` - Number of grids in this acquisition
- `total_grid_squares` - Number of grid squares across all grids
- `total_foil_holes` - Number of foil holes
- `total_micrographs` - Number of micrographs collected
- `completion_percentage` - Percentage of acquisition completed
- `active_session_count` - Number of active sessions for this acquisition

**Use Case:**
The admin dashboard should show acquisition statistics at a glance without requiring multiple API calls per acquisition.

## Proposed Changes

### 1. Define Proper Schemas for Debug Endpoints

#### Session Response Schema

```python
class SessionResponse(BaseModel):
    session_id: str
    agent_id: str
    acquisition_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    status: Literal["active", "idle", "processing", "disconnected", "failed"]
    last_activity: Optional[datetime] = None
    connection_type: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
```

Update endpoint:

```python
@router.get("/debug/sessions", response_model=List[SessionResponse])
async def get_active_sessions() -> List[SessionResponse]:
    ...
```

#### Agent Connection Response Schema

```python
class AgentConnectionResponse(BaseModel):
    agent_id: str
    session_id: Optional[str] = None
    connected_at: datetime
    last_heartbeat: datetime
    status: Literal["connected", "active", "idle", "disconnected"]
    connection_type: Optional[str] = None
    client_version: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
```

Update endpoint:

```python
@router.get("/debug/agent-connections", response_model=List[AgentConnectionResponse])
async def get_active_connections() -> List[AgentConnectionResponse]:
    ...
```

#### Connection Stats Response Schema

```python
class ConnectionStatsResponse(BaseModel):
    active_sessions: int
    active_connections: int
    total_sessions: int
    total_sessions_today: int
    total_instructions_sent: int
    total_instructions_acknowledged: int
    average_response_time_ms: Optional[float] = None
    uptime_seconds: int
```

Update endpoint:

```python
@router.get("/debug/connection-stats", response_model=ConnectionStatsResponse)
async def get_connection_stats() -> ConnectionStatsResponse:
    ...
```

### 2. Add Historical Sessions Endpoint

```python
class SessionHistoryQueryParams(BaseModel):
    status: Optional[str] = None
    acquisition_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = 100
    offset: int = 0

@router.get("/sessions", response_model=List[SessionResponse])
async def get_sessions(
    query: SessionHistoryQueryParams = Depends()
) -> List[SessionResponse]:
    """
    Get all sessions with optional filtering.
    Includes both active and historical sessions.
    """
    ...

@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session_by_id(session_id: str) -> SessionResponse:
    """Get details for a specific session."""
    ...
```

### 3. Add Acquisition Statistics

**Option A: Extend existing AcquisitionResponse**

```python
class AcquisitionResponse(BaseModel):
    uuid: str
    name: Optional[str]
    status: Optional[AcquisitionStatus]
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    # ... existing fields ...

    # NEW FIELDS
    total_grids: Optional[int] = None
    total_grid_squares: Optional[int] = None
    total_foil_holes: Optional[int] = None
    total_micrographs: Optional[int] = None
    active_sessions: Optional[int] = None
    completion_percentage: Optional[float] = None
```

**Option B: Create dedicated stats endpoint**

```python
class AcquisitionStatsResponse(BaseModel):
    acquisition_id: str
    total_grids: int
    total_grid_squares: int
    total_foil_holes: int
    total_micrographs: int
    active_sessions: int
    completed_sessions: int
    failed_sessions: int
    completion_percentage: float
    estimated_completion_time: Optional[datetime] = None

@router.get("/acquisitions/{acquisition_uuid}/stats", response_model=AcquisitionStatsResponse)
async def get_acquisition_stats(acquisition_uuid: str) -> AcquisitionStatsResponse:
    """Get aggregated statistics for an acquisition."""
    ...
```

### 4. Move Debug Endpoints to Production

Consider moving these endpoints from `/debug/*` to regular API paths since they're now being used in the production UI:

- `/debug/sessions` → `/sessions` (with proper authentication)
- `/debug/agent-connections` → `/agent-connections` (with proper authentication)
- `/debug/connection-stats` → `/stats/connections` (with proper authentication)

## Implementation Priority

1. **HIGH PRIORITY**: Define proper schemas for existing debug endpoints (Sessions, Connections, Stats)
2. **MEDIUM PRIORITY**: Add historical sessions endpoint with filtering
3. **MEDIUM PRIORITY**: Add acquisition statistics (either in response or dedicated endpoint)
4. **LOW PRIORITY**: Move debug endpoints to production paths with authentication

## Breaking Changes

- None if we maintain the `/debug/*` endpoints as-is and add schemas
- If moving to production endpoints, the frontend will need to update API calls

## Testing Requirements

- Unit tests for all new response models
- Integration tests for historical session queries
- Performance tests for aggregated acquisition stats (may need caching)
- Mock data generation for all new schemas

## Frontend Impact

Once these changes are implemented, the frontend will:

- Remove custom TypeScript interfaces for sessions/connections
- Use auto-generated types from OpenAPI spec
- Remove custom MSW mock handlers
- Benefit from improved type safety and autocomplete

## Related Files

**Backend:**

- OpenAPI spec: `smartem/swagger.json` (or wherever API spec is generated)
- Session management code (location TBD)
- Connection management code (location TBD)

**Frontend:**

- `/app/routes/admin.tsx` - Admin dashboard implementation
- `/app/mocks/customHandlers.ts` - Custom mock handlers (can be removed after)
- `/app/api/generated/` - Auto-generated API client code

## Additional Notes

The admin dashboard is functional with custom mocks and type definitions, but proper API schemas would:

1. Improve developer experience
2. Ensure data consistency
3. Enable better error handling
4. Provide automatic API documentation
5. Make the codebase more maintainable

## Questions for Discussion

1. Should we keep `/debug/*` prefix or move to production endpoints?
2. Should acquisition stats be included in the main response or separate endpoint?
3. Do we need authentication/authorization for these endpoints?
4. Should we implement pagination for session history from the start?
5. What retention period should we use for historical session data?
