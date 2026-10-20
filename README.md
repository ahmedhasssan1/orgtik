# Sales Request Management API

A NestJS, TypeScript, PostgreSQL, and TypeORM API for receiving sales leads,
managing assignments and status, and tracking request activity.

## Requirements

- Node.js 20+
- npm
- PostgreSQL 14+

## Run locally

1. Create a PostgreSQL database (for example `sales`).
2. Install packages and create your local environment file:

   ```bash
   npm install
   ```

   Edit `.env` and set `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and
   `DB_DATABASE` to match your PostgreSQL instance. The sample credentials are
   for local development only; `.env` is ignored by Git.

   The `.env` file looks like:

   ```env
   PORT=3000

   # PostgreSQL connection
   DB_HOST=
   DB_PORT=
   DB_USERNAME=
   DB_PASSWORD=
   DB_DATABASE=
   DB_SYNCHRONIZE=
   ```

3. Start the API:

   ```bash
   npm run start:dev
   ```

   Set `DB_SYNCHRONIZE=true` to let TypeORM auto-synchronize the entity schema
   (the sample `.env` enables it). Production deployments should provision and
   migrate the schema separately.

The server listens on port `3000` by default; override with `PORT`.

## Mock authentication and roles

Protected `/requests` endpoints use a single mock header instead of real
authentication:

```text
x-user-role: admin
```

Use `x-user-role: admin` for an admin. Any other non-empty value is treated as
an agent, and that value becomes the agent's ID (for example `agent` or
`agent-1`):

```text
x-user-role: agent-1
```

Admins can list and view every request, assign requests, and change status.
Agents can only list, view, and change the status of requests assigned to their
ID. Agents cannot assign requests. Admin-only routes are enforced by a
`RolesGuard` using the `@Roles()` decorator. The webhook endpoint is
unauthenticated for integration simplicity; secure it with a shared secret or
signature verification before production use.

Calling a protected endpoint without this header returns:

```json
{
  "message": "Provide the x-user-role header.",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### Postman

Add one request **Header**:

| Header        | Value   |
| ------------- | ------- |
| `x-user-role` | `admin` |

For an agent, use their ID as the value, for example `agent-1`.

### curl

```bash
# Admin
curl -H "x-user-role: admin" http://localhost:3000/requests

# Agent
curl -H "x-user-role: agent-1" http://localhost:3000/requests
```

The `POST /requests/{id}/assign` endpoint additionally requires
`x-user-role: admin`; agents receive `403 Forbidden`.

## API

### Receive an external request (webhook)

`POST /webhooks/sales-requests`

```json
{
  "externalId": "crm-12345",
  "customerName": "Ada Customer",
  "email": "ada@example.com",
  "description": "Interested in the enterprise plan"
}
```

Returns `201 Created` for a new request and `200 OK` with the existing request
when `externalId` has already been received. The database unique constraint
ensures duplicate deliveries cannot create duplicate records. New requests start
in `NEW`, with an initial activity event.

### List requests

`GET /requests?page=1&limit=20&status=NEW&search=ada`

All query parameters are optional. `search` matches external ID, customer name,
or email. `limit` is capped at 100. Agent results are always restricted to the
authenticated agent's assignments.

### Get request and activity history

`GET /requests/{requestId}`

Returns request details and its ordered activity history. An agent receives
`404 Not Found` for requests not assigned to them.

### Assign a request (admin only)

`POST /requests/{requestId}/assign`

```json
{ "agentId": "agent-1" }
```

Assignment changes are recorded in request activity history.

### Advance request status

`PATCH /requests/{requestId}/status`

```json
{ "status": "CONTACTED" }
```

Statuses must advance exactly one step: `NEW` → `CONTACTED` → `QUALIFIED` →
`CLOSED`. Status changes are recorded with the acting user and previous/new
values.

## Validation and errors

Request bodies and query parameters are validated; unknown body fields are
rejected. Invalid inputs return `400`, missing/invalid mock headers return `401`,
and role/ownership violations return `403` or `404` as appropriate.

## Tests and build

```bash
npm test -- --runInBand
npm run build
```
