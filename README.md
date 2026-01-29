# ServerTracker

> **NOTICE**: This project is being re-written to be shippable, maintainable, and in line with current experience. Expect to see PostreSQL, Kysely and SQL migrations, a staff panel, real player sessions with history, a home for metrics, and more.  More details will be posted soon!

---

**ServerTracker** is a system for tracking Mojang server uptime and player sessions. It includes a backend Express REST API (Node.js + TypeScript) and a Spigot plugin that registers servers, sends heartbeats, and reports player activity. Redis and MySQL are used to store both volatile and persistent data.

This project is organized into two main modules:
- `api/`: Handles server registration, heartbeats, and downtime tracking.
- `plugin/`: A Spigot plugin that tracks server and player state and communicates with the API.
---

## Features

- Server registration with persistent metadata (name, version, environment, etc.)
- Heartbeat system using Redis with expiring keys for live state tracking
- Player session tracking (includes `uuid`, `username`, `joinedAt`, `vanished`)
- Global player count aggregation and Redis pub/sub distribution -> sends to Spigot to cache.
- - Useful for lobby sidebars in displaying the player count without hitting the API
- Scheduled downtime detection based on heartbeat timeouts
- Asynchronous, modular plugin built with Guice

## What This Is Not

- Not meant to be a plug-and-play *yet* — setup is required.
  - The rewrite will very easy to install and setup.
- No metrics system (yet)
- Built as a foundation for future expansion

## Requirements
Tech stack is shown below, but of course, the following is required:
1. MySQL database server,
2. Redis server
3. Spigot server on 1.21.5

## Tech Stack

| Layer        | Tech                               |
|--------------|------------------------------------|
| Backend      | Node.js (Express), TypeScript      |
| Plugin       | Java (Spigot 1.21.5)               |
| Database     | MySQL                              |
| Cache        | Redis                              |
| Plugin Libs  | Jackson, Retrofit, Guice           |

---

## Repository Structure
