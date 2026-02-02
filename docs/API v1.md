# Tamagochi API Documentation

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Health Check](#health-check)
  - [Strinova Redeem Codes](#strinova-redeem-codes)
  - [Rewards](#rewards)
  - [Uploaders](#uploaders)
  - [Admin API Keys](#admin-api-keys)
- [Error Responses](#error-responses)
- [Rate Limiting](#rate-limiting)

---

## Base URL

```url
http://localhost:4000
```

## API Documentation

Interactive API documentation is available at:

```url
http://localhost:4000/api-docs
```

The Swagger UI provides a complete, interactive interface to explore and test all API endpoints.

---

## Authentication

### API Key Authentication

Most endpoints require an API key sent via headers:

```http
x-api-key: your-api-key-here
```

### Admin Authentication

Admin endpoints require an Authorization header:

```http
Authorization: your-admin-token-here
```

---

## API Endpoints

### Health Check

#### `GET /`

Health check endpoint with rate limit information.

**Headers:**

- `x-api-key` (optional)

**Response:**

```json
{
  "status": "200",
  "message": "i'm alive!",
  "rateLimit": {
    "limit": 100,
    "remaining": 99,
    "reset": "2026-01-31T12:00:00.000Z"
  }
}
```

---

### Strinova Redeem Codes

#### `GET /api/v1/strinova`

Health check for Strinova API with rate limit info.

**Headers:**

- `x-api-key` (optional)

**Response:**

```json
{
  "status": "200",
  "message": "i'm alive!",
  "rateLimit": {
    "limit": 100,
    "remaining": 99,
    "reset": "2026-01-31T12:00:00.000Z"
  }
}
```

---

#### `GET /api/v1/strinova/code`

Get all redeem codes with optional filtering.

**Headers:**

- `x-api-key` (optional)

**Query Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `active` | boolean | Filter active codes (not expired). Use `true` or `false` |
| `reward` | string | Filter by reward name (case-insensitive partial match) |
| `version` | string | Filter by version (`global`, `cn`, or `mobile`) |
| `sort` | string | Sort order: `index`, `-index`, `created_at`, `-created_at` (default: `index` asc) |

**Examples:**

```http
GET /api/v1/strinova/code
GET /api/v1/strinova/code?active=true
GET /api/v1/strinova/code?reward=gems
GET /api/v1/strinova/code?version=global
GET /api/v1/strinova/code?sort=-created_at
GET /api/v1/strinova/code?active=true&version=global&sort=index
```

**Response:**

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "6979f1120a08f8372fad355d",
      "uploader_id": "6979f06fd05710e613574c79",
      "code": "STRINOVA2026",
      "version": "global",
      "index": 0,
      "expired_at": "2026-12-31T23:59:59.999Z",
      "created_at": "2026-01-28T11:20:50.241Z",
      "rewards": [
        {
          "reward_id": "6979f06fd05710e613574c80",
          "name": "Bablo",
          "icon": "https://example.domain/bablo.png",
          "amount": 100
        }
      ]
    }
  ]
}
```

---

#### `POST /api/v1/strinova/code`

Create a new redeem code.

**Headers:**

- `x-api-key` (required)

**Request Body:**

```json
{
  "uploader_id": "6979f06fd05710e613574c79",
  "code": "NEWCODE2026",
  "version": "global",
  "index": 0,
  "expired_at": "2026-12-31",
  "rewards": [
    {
      "reward_id": "6979f06fd05710e613574c80",
      "name": "Bablo",
      "icon": "https://example.domain/bablo.png",
      "amount": 100
    }
  ]
}
```

**Alternative using Discord UID:**

```json
{
  "discord_uid": "123456789012345678",
  "code": "NEWCODE2026",
  "version": "global",
  "index": 0,
  "expired_at": "2026-12-31",
  "rewards": []
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `uploader_id` | string | * | MongoDB ObjectId of the uploader (either this or discord_uid) |
| `discord_uid` | string | * | Discord user ID (either this or uploader_id) |
| `code` | string | ✅ | Unique redeem code |
| `version` | string | ❌ | Version type: `global`, `cn`, or `mobile` |
| `index` | integer | ❌ | Sort order index (lower numbers appear first, default: 0) |
| `expired_at` | string | ❌ | Expiration date. Formats: `YYYY-MM-DD`, `DD/MM/YYYY`, or ISO 8601 |
| `rewards` | array | ❌ | Array of reward objects |

**Date Formats Supported:**

- `2026-12-31` (YYYY-MM-DD)
- `31/12/2026` (DD/MM/YYYY)
- `2026-12-31T23:59:59.000Z` (ISO 8601)

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "id": "6979f1120a08f8372fad355d",
    "uploader_id": "6979f06fd05710e613574c79",
    "code": "NEWCODE2026",
    "version": "global",
    "index": 0,
    "expired_at": "2026-12-31T23:59:59.999Z",
    "created_at": "2026-01-31T10:30:00.000Z",
    "rewards": []
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Missing required fields
{
  "success": false,
  "error": "uploader_id and code are required"
}

// 400 Bad Request - Invalid date format
{
  "success": false,
  "error": "Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY"
}

// 409 Conflict - Duplicate code
{
  "success": false,
  "error": "Redeem code already exists"
}

// 503 Service Unavailable - Database error
{
  "success": false,
  "error": "Database connection error. Please try again later."
}
```

---

#### `PATCH /api/v1/strinova/code/:id`

Update an existing redeem code.

**Headers:**

- `x-api-key` (required)

**URL Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `id` | string | MongoDB ObjectId of the redeem code |

**Request Body:**

```json
{
  "code": "UPDATED2026",
  "expired_at": "2027-12-31",
  "rewards": [
    {
      "reward_id": "6979f06fd05710e613574c80",
      "name": "Bablo",
      "icon": "https://example.domain/bablo.png",
      "amount": 200
    }
  ]
}
```

**Field Descriptions:**

All fields are optional. Only include fields you want to update.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `code` | string | ❌ | New redeem code value |
| `expired_at` | string | ❌ | New expiration date. Formats: `YYYY-MM-DD`, `DD/MM/YYYY`, or ISO 8601. Use `null` to remove expiration |
| `rewards` | array | ❌ | Updated rewards array (replaces existing rewards) |

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "id": "6979f1120a08f8372fad355d",
    "uploader_id": "6979f06fd05710e613574c79",
    "code": "UPDATED2026",
    "expired_at": "2027-12-31T23:59:59.999Z",
    "created_at": "2026-01-28T11:20:50.241Z",
    "rewards": [
      {
        "reward_id": "6979f06fd05710e613574c80",
        "name": "Bablo",
        "icon": "https://example.domain/bablo.png",
        "amount": 200
      }
    ]
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Invalid format
{
  "success": false,
  "error": "Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY"
}

// 404 Not Found
{
  "success": false,
  "error": "Redeem code not found"
}

// 409 Conflict - Duplicate code
{
  "success": false,
  "error": "Redeem code already exists"
}
```

---

### Rewards

#### `GET /api/v1/rewards`

Get all rewards.

**Headers:**

- `x-api-key` (optional)

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "6979f06fd05710e613574c80",
      "name": "Bablo",
      "icon": "https://example.domain/bablo.png"
    },
    {
      "id": "6979f06fd05710e613574c81",
      "name": "Dream Token",
      "icon": "https://example.domain/dream_token.png"
    }
  ]
}
```

### DELETE `/api/v1/strinova/code/:id`

Delete a redeem code.

**Authentication:** Required (x-api-key)

**URL Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `id` | string | The redeem code ID (MongoDB ObjectId) |

**Response (Success):**

```json
{
  "success": true,
  "message": "Redeem code deleted successfully"
}
```

**Error Responses:**

```json
// 400 Bad Request - Invalid ID format
{
  "success": false,
  "error": "Invalid redeem code ID format"
}

// 404 Not Found
{
  "success": false,
  "error": "Redeem code not found"
}

// 500 Server Error
{
  "success": false,
  "error": "Failed to delete redeem code"
}
```

---

#### `GET /api/v1/rewards/:id`

Get reward by ID.

**Headers:**

- `x-api-key` (optional)

**URL Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `id` | string | MongoDB ObjectId of the reward |

**Example:**

```http
GET /api/v1/rewards/6979f06fd05710e613574c80
```

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "id": "6979f06fd05710e613574c80",
    "name": "Bablo",
    "icon": "https://example.domain/bablo.png"
  }
}
```

**Error Response:**

```json
// 404 Not Found
{
  "success": false,
  "error": "Reward not found"
}
```

---

#### `POST /api/v1/rewards`

Create a new reward with optional image upload.

**Headers:**

- `Authorization` (required)

**Request (Option 1 - Upload Image File):**

Content-Type: `multipart/form-data`

```txt
name: Bablo
icon: [image file - jpg/png/gif/webp, max 5MB]
```

**Request (Option 2 - Provide URL):**

Content-Type: `multipart/form-data` or `application/json`

```json
{
  "name": "Bablo",
  "iconUrl": "https://example.domain/bablo.png"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | ✅ | Name of the reward |
| `icon` | file | ❌ | Image file to upload (jpg, png, gif, webp - max 5MB) |
| `iconUrl` | string | ❌ | Direct icon URL (if not uploading file) |

**Note:** You can either upload an image file (`icon`) or provide a URL (`iconUrl`). If both are provided, the uploaded file takes priority. The image will be automatically resized to max 512x512px and optimized via Cloudinary.

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "id": "6979f06fd05710e613574c80",
    "name": "Bablo",
    "icon": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/rewards/abc123.png"
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Missing required field
{
  "success": false,
  "error": "Name is required"
}

// 400 Bad Request - File too large
{
  "success": false,
  "error": "File size too large. Maximum size is 5MB"
}

// 400 Bad Request - Invalid file type
{
  "success": false,
  "error": "Only image files are allowed!"
}

// 500 Internal Server Error - Cloudinary not configured
{
  "success": false,
  "error": "Cloudinary is not configured. Cannot upload image."
}

// 500 Internal Server Error
{
  "success": false,
  "error": "Failed to create reward"
}
```

**cURL Example (Upload File):**

```bash
curl -X POST http://localhost:4000/api/v1/rewards \
  -H "Authorization: Bearer your-admin-key" \
  -F "name=Bablo" \
  -F "icon=@/path/to/image.png"
```

**cURL Example (Provide URL):**

```bash
curl -X POST http://localhost:4000/api/v1/rewards \
  -H "Authorization: Bearer your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "Bablo", "iconUrl": "https://example.com/icon.png"}'
```

---

#### `PATCH /api/v1/rewards/:id`

Update an existing reward.

**Headers:**

- `Authorization` (required)

**URL Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `id` | string | MongoDB ObjectId of the reward |

**Request Body (multipart/form-data):**

```txt
name: Updated Bablo
icon: [image file - optional]
iconUrl: https://example.com/new-icon.png (optional)
```

**Field Descriptions:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | ❌ | New name of the reward |
| `icon` | file | ❌ | New icon image file |
| `iconUrl` | string | ❌ | New icon URL |

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "id": "6979f06fd05710e613574c80",
    "name": "Updated Bablo",
    "icon": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/rewards/updated.png"
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - No fields to update
{
  "success": false,
  "error": "No valid fields to update"
}

// 404 Not Found
{
  "success": false,
  "error": "Reward not found"
}

// 500 Internal Server Error
{
  "success": false,
  "error": "Failed to update reward"
}
```

**cURL Example:**

```bash
curl -X PATCH http://localhost:4000/api/v1/rewards/6979f06fd05710e613574c80 \
  -H "Authorization: Bearer your-admin-key" \
  -F "name=Updated Bablo" \
  -F "icon=@/path/to/new-image.png"
```

---

#### `DELETE /api/v1/rewards/:id`

Delete a reward.

**Headers:**

- `Authorization` (required)

**URL Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `id` | string | MongoDB ObjectId of the reward |

**Response (Success):**

```json
{
  "success": true,
  "message": "Reward deleted successfully"
}
```

**Error Responses:**

```json
// 400 Bad Request - Invalid ID format
{
  "success": false,
  "error": "Invalid reward ID format"
}

// 404 Not Found
{
  "success": false,
  "error": "Reward not found"
}

// 500 Internal Server Error
{
  "success": false,
  "error": "Failed to delete reward"
}
```

**cURL Example:**

```bash
curl -X DELETE http://localhost:4000/api/v1/rewards/6979f06fd05710e613574c80 \
  -H "Authorization: Bearer your-admin-key"
```

---

### Uploaders

#### `GET /api/v1/uploaders`

Get all uploaders.

**Headers:**

- `x-api-key` (optional)

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "6979f06fd05710e613574c79",
      "name": "Shiorin625",
      "discord_uid": "123456789012345678",
      "type": "default",
      "status": "active",
      "created_at": "2026-01-15T10:00:00.000Z"
    },
    {
      "id": "6979f06fd05710e613574c80",
      "name": "User123",
      "discord_uid": "987654321098765432",
      "type": "manager",
      "status": "suspended",
      "created_at": "2026-01-20T15:30:00.000Z"
    }
  ]
}
```

---

#### `GET /api/v1/uploaders/:id`

Get uploader by ID.

**Headers:**

- `x-api-key` (optional)

**URL Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `id` | string | MongoDB ObjectId of the uploader |

**Example:**

```http
GET /api/v1/uploaders/6979f06fd05710e613574c79
```

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "id": "6979f06fd05710e613574c79",
    "name": "Shiorin625",
    "discord_uid": "123456789012345678",
    "type": "default",
    "status": "active",
    "created_at": "2026-01-15T10:00:00.000Z"
  }
}
```

**Error Response:**

```json
// 404 Not Found
{
  "success": false,
  "error": "Uploader not found"
}
```

---

#### `GET /api/v1/uploaders/discord/:discordUid`

Get uploader by Discord user ID.

**Headers:**

- `x-api-key` (optional)

**URL Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `discordUid` | string | Discord user ID |

**Example:**

```http
GET /api/v1/uploaders/discord/123456789012345678
```

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "id": "6979f06fd05710e613574c79",
    "name": "Shiorin625",
    "discord_uid": "123456789012345678",
    "type": "default",
    "status": "active",
    "created_at": "2026-01-15T10:00:00.000Z"
  }
}
```

**Error Response:**

```json
// 404 Not Found
{
  "success": false,
  "error": "Uploader not found with this Discord ID"
}
```

---

#### `POST /api/v1/uploaders`

Create a new uploader.

**Headers:**

- `Authorization` (required)

**Request Body:**

```json
{
  "name": "Shiorin625",
  "discord_uid": "123456789012345678",
  "type": "default",
  "status": "active"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | ✅ | Uploader's name |
| `discord_uid` | string | ✅ | Discord user ID |
| `type` | string | ❌ | Type/role: default, manager, or admin (default: default) |
| `status` | string | ❌ | Status: active, suspended, or banned (default: active) |

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "id": "6979f06fd05710e613574c79",
    "name": "Shiorin625",
    "discord_uid": "123456789012345678",
    "type": "default",
    "status": "active",
    "created_at": "2026-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Missing required fields
{
  "success": false,
  "error": "name and discord_uid are required"
}

// 400 Bad Request - Invalid type
{
  "success": false,
  "error": "Invalid type. Must be: default, manager, or admin"
}

// 400 Bad Request - Invalid status
{
  "success": false,
  "error": "status must be: active, suspended, or banned"
}

// 409 Conflict
{
  "success": false,
  "error": "Uploader with this Discord ID already exists"
}
```

---

#### `PATCH /api/v1/uploaders/:id/status`

Update uploader status.

**Headers:**

- `Authorization` (required)

**URL Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `id` | string | MongoDB ObjectId of the uploader |

**Request Body:**

```json
{
  "status": "suspended"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `status` | string | ✅ | New status: active, suspended, or banned |

**Response (Success):**

```json
{
  "success": true,
  "message": "Uploader status updated successfully"
}
```

**Error Responses:**

```json
// 400 Bad Request
{
  "success": false,
  "error": "status is required"
}

// 404 Not Found
{
  "success": false,
  "error": "Uploader not found"
}
```

---

### Admin API Keys

#### `GET /api/v1/admin/keys`

Get all API keys.

**Headers:**

- `Authorization` (required)

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "69788bf6d3239aecdc899a50",
      "key": "fbd384e7f16f2a51546ba24b002a35cf...",
      "name": "Shiorin625",
      "discord_uid": "123456789012345678",
      "description": "Provider api key",
      "is_active": true,
      "created_at": "2026-01-27T09:57:10.888Z",
      "last_used_at": "2026-01-28T11:14:28.600Z"
    }
  ]
}
```

---

#### `POST /api/v1/admin/keys`

Create a new API key.

**Headers:**

- `Authorization` (required)

**Request Body:**

```json
{
  "name": "New API Key",
  "discord_uid": "123456789012345678",
  "description": "Optional description"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | ✅ | Name for the API key |
| `discord_uid` | string | ❌ | Discord user ID |
| `description` | string | ❌ | Description of the key's purpose |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "69788bf6d3239aecdc899a51",
    "key": "a1b2c3d4e5f6...",
    "name": "New API Key",
    "discord_uid": "123456789012345678",
    "description": "Optional description",
    "is_active": true,
    "created_at": "2026-01-31T10:30:00.000Z",
    "last_used_at": null
  }
}
```

---

#### `GET /api/v1/admin/keys/discord/:discordUid`

Get API key by Discord user ID.

**Headers:**

- `Authorization` (required)

**URL Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `discordUid` | string | Discord user ID |

**Example:**

```http
GET /api/v1/admin/keys/discord/123456789012345678
```

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "id": "69788bf6d3239aecdc899a50",
    "key": "fbd384e7f16f2a51546ba24b002a35cf...",
    "name": "Shiorin625",
    "discord_uid": "123456789012345678",
    "description": "Provider api key",
    "is_active": true,
    "created_at": "2026-01-27T09:57:10.888Z",
    "last_used_at": "2026-01-28T11:14:28.600Z"
  }
}
```

**Error Response:**

```json
// 404 Not Found
{
  "success": false,
  "error": "No active API key found for this Discord user"
}
```

---

#### `DELETE /api/v1/admin/keys/:key`

Deactivate an API key.

**Headers:**

- `Authorization` (required)

**URL Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `key` | string | The API key to deactivate |

**Example:**

```http
DELETE /api/v1/admin/keys/fbd384e7f16f2a51546ba24b002a35cf
```

**Response (Success):**

```json
{
  "success": true,
  "message": "API key deactivated successfully"
}
```

**Error Response:**

```json
// 404 Not Found
{
  "success": false,
  "error": "API key not found"
}
```

## Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error (development mode only)"
}
```

### HTTP Status Codes

| Code | Description |
| --- | --- |
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing API key |
| 404 | Not Found |
| 409 | Conflict - Duplicate resource |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Database error |

---

## Rate Limiting

All API endpoints are rate-limited to prevent abuse.

**Default Limits:**

- Configurable via `RATE_LIMITER_MAX_REQUESTS` environment variable
- Rate limit info included in response headers and body

**Rate Limit Headers:**

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1706702400000
```

**Rate Limit in Response Body:**

```json
{
  "rateLimit": {
    "limit": 100,
    "remaining": 99,
    "reset": "2026-01-31T12:00:00.000Z"
  }
}
```

When rate limit is exceeded:

```json
{
  "success": false,
  "error": "Too many requests, please try again later."
}
```

---

## Notes

### Date Handling

- All dates are stored in MongoDB as `Date` type
- API returns dates in ISO 8601 format (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- Expired codes are those where `expired_at < current_date`
- If `expired_at` is `null`, the code never expires

### ObjectId Format

- All `_id` fields and references use MongoDB ObjectId
- Format: 24-character hexadecimal string
- Example: `6979f06fd05710e613574c79`

### Caching in redeem_codes

The `rewards` array in `redeem_codes` caches the reward `name` and `icon` for performance. This means:

- No need to join with `rewards` collection on every query
- If reward details change, existing codes retain old values
- New codes will have updated values

---

## Environment Variables

```bash
# Server
PORT=4000
SERVER_URL=http://localhost:4000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
MONGODB_DBNAME=Strinova

# Security
AUTH_KEY=your-admin-auth-key
DEFAULT_API_KEY=your-default-api-key
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMITER_MAX_REQUESTS=100
```

**Environment Variables Description:**

| Variable | Description |
| --- | --- |
| `AUTH_KEY` | Admin authentication key for protected endpoints |
| `DEFAULT_API_KEY` | Default API key automatically added to database on startup |

**Note:** The `DEFAULT_API_KEY` will be automatically inserted into the `api_keys` collection when the server starts. If the key already exists but is inactive, it will be reactivated.

---

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [REST API Best Practices](https://restfulapi.net/)

---

**Last Updated:** February 1, 2026
**API Version:** v1
