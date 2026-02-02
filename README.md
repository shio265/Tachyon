# Tachyon

REST API server with authentication, rate limiting, and reward system.

## Installation

```bash
bun install
```

## Usage

```bash
bun run start
```

## API Structure

- `/api/v1/` - Version 1 endpoints
  - API key management
  - Strinova integration
  - Redeem codes and rewards

## Features

- MongoDB database integration
- API key authentication
- Rate limiting
- Reward and redeem code system
- Cloudinary image upload for reward icons

## Documentation

See `/docs` folder for detailed API documentation and database schema:

- [API v1 Documentation](docs/API%20v1.md)
- [Database Schema](docs/DATABASE.md)
