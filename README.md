# Vulnerable Auth Backend

⚠️ **WARNING**: This backend contains intentional SQL injection vulnerabilities for testing purposes only.

## Overview

Node.js/Express backend with SQLite database and SQL injection vulnerabilities in authentication endpoints.

## Setup

### Install Dependencies
```bash
npm install
```

### Start Server
```bash
npm start
```

Server runs on `http://localhost:5000/api`

## Endpoints

### 1. POST `/auth/login` (VULNERABLE - SQL Injection)
Login endpoint with SQL injection vulnerability.

**Request:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "user"
  }
}
```

**SQL Injection Example:**
- Payload: `username: "admin' OR '1'='1"`
- Bypasses authentication

### 2. POST `/auth/register` (SECURE)
Register new user with parameterized queries.

**Request:**
```json
{
  "username": "newuser",
  "password": "pass123",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "userId": 2
}
```

### 3. GET `/auth/search?search=term` (VULNERABLE - SQL Injection)
Search users with SQL injection vulnerability.

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com"
    }
  ]
}
```

**SQL Injection Example:**
- Payload: `search: "%' OR '1'='1"`
- Returns all users

### 4. GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "Server is running",
  "db": "SQLite"
}
```

## Database

SQLite database with users table:
- `id` - Primary key
- `username` - Unique
- `password` - Plain text
- `email` - Unique
- `role` - Default: 'user'
- `created_at` - Timestamp

## Environment

`.env` file:
```
PORT=5000
REACT_URL=http://localhost:3000
DATABASE=auth.db
NODE_ENV=development
```

## Files

- `server.js` - Express server
- `package.json` - Dependencies
- `.env` - Configuration
- `.gitignore` - Git ignore
- `auth.db` - SQLite database
