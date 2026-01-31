# Tamagochi API Documentation

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Health Check](#health-check)
  - [Strinova Redeem Codes](#strinova-redeem-codes)
  - [Admin API Keys](#admin-api-keys)
- [Error Responses](#error-responses)
- [Rate Limiting](#rate-limiting)

---

## Base URL

```url
http://localhost:4000
```

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

**Examples:**

```http
GET /api/v1/strinova/code
GET /api/v1/strinova/code?active=true
GET /api/v1/strinova/code?reward=gems
GET /api/v1/strinova/code?active=true&reward=coins
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

**Field Descriptions:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `uploader_id` | string | ✅ | MongoDB ObjectId of the uploader |
| `code` | string | ✅ | Unique redeem code |
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
  "description": "Optional description"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | ✅ | Name for the API key |
| `description` | string | ❌ | Description of the key's purpose |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "69788bf6d3239aecdc899a51",
    "key": "a1b2c3d4e5f6...",
    "name": "New API Key",
    "description": "Optional description",
    "is_active": true,
    "created_at": "2026-01-31T10:30:00.000Z",
    "last_used_at": null
  }
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
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMITER_MAX_REQUESTS=100
```

---

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [REST API Best Practices](https://restfulapi.net/)

---

**Last Updated:** January 31, 2026
**API Version:** v1
