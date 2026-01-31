
# Database Structure

## Collections Overview

```schema
Strinova (Database)
├── uploaders
├── rewards
├── redeem_codes
└── api_keys
```

---

### 1. `uploaders` Collection

Stores information about users who upload redeem codes.

**Schema:**

```javascript
{
  _id: ObjectId,           // Auto-generated
  name: String,            // REQUIRED: Uploader's name
  discord_uid: String,     // REQUIRED: Discord user ID (UNIQUE)
  created_at: Date         // REQUIRED: Account creation date
}
```

**Indexes:**

- `discord_uid` (unique)

**Example Document:**

```json
{
  "_id": "6979f06fd05710e613574c79",
  "name": "Shiorin625",
  "discord_uid": "123456789012345678",
  "created_at": "2026-01-15T10:00:00.000Z"
}
```

---

### 2. `rewards` Collection

Stores reward items that can be included in redeem codes.

**Schema:**

```javascript
{
  _id: ObjectId,        // Auto-generated
  name: String,         // REQUIRED: Reward name
  icon: String | null   // OPTIONAL: Icon filename or URL
}
```

**Indexes:**

- `name` (non-unique)

**Example Document:**

```json
{
  "_id": "6979f06fd05710e613574c80",
  "name": "Bablo",
  "icon": "https://example.domain/bablo.png"
}
```

---

### 3. `redeem_codes` Collection

Stores redeem codes with their associated rewards and metadata.

**Schema:**

```javascript
{
  _id: ObjectId,           // Auto-generated
  uploader_id: ObjectId,   // REQUIRED: Reference to uploaders._id
  code: String,            // REQUIRED: Unique redeem code (UNIQUE)
  expired_at: Date | null, // OPTIONAL: Expiration date
  created_at: Date,        // REQUIRED: Creation date
  rewards: [               // OPTIONAL: Array of rewards
    {
      reward_id: ObjectId, // REQUIRED: Reference to rewards._id
      name: String,        // REQUIRED: Cached reward name
      icon: String,        // REQUIRED: Cached reward icon
      amount: Int32        // REQUIRED: Quantity of reward
    }
  ]
}
```

**Indexes:**

- `code` (unique)
- `expired_at` (non-unique)
- `uploader_id` (non-unique)

**Example Document:**

```json
{
  "_id": "6979f1120a08f8372fad355d",
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
    },
    {
      "reward_id": "6979f06fd05710e613574c81",
      "name": "Dream Token",
      "icon": "https://example.domain/dream_token.png",
      "amount": 5000
    }
  ]
}
```

---

### 4. `api_keys` Collection

Stores API keys for authentication.

**Schema:**

```javascript
{
  _id: ObjectId,               // Auto-generated
  key: String,                 // REQUIRED: API key (UNIQUE)
  name: String,                // REQUIRED: Key identifier/name
  description: String | null,  // OPTIONAL: Key description
  is_active: Boolean,          // REQUIRED: Active status (default: true)
  created_at: Date,            // REQUIRED: Creation date
  last_used_at: Date | null    // OPTIONAL: Last usage timestamp
}
```

**Indexes:**

- `key` (unique)
- `is_active` (non-unique)

**Example Document:**

```json
{
  "_id": "69788bf6d3239aecdc899a50",
  "key": "examplekey",
  "name": "Shio625",
  "description": "Provider api key",
  "is_active": true,
  "created_at": "2026-01-27T09:57:10.888Z",
  "last_used_at": "2026-01-28T11:14:28.600Z"
}
```

---

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)

---

**Last Updated:** January 31, 2026
