# Server Tracker

**Server Tracker** is a system for tracking Minecraft server uptime and player sessions. It includes a backend API (Expess server) written with TypeScript and a Spigot plugin that registers servers, sends heartbeats, and tracks player activity. MySQL is used for persistent storing of servers, while Redis is used for volatile data and publishing messages.

This project is organized into two main modules:
- `api/`: Handles all requests from consumers and facilitates server registration, heartbeats, downtime tracking, and live stats.
- `plugin/`: A Spigot server plugin and consumer to the API. The plugin sends heartbeats with player sessions upward.

**Note**: This is a functional proof-of-concept residing in its early phases. This will be worked on over time.

---

## Current Features

- **Automatic server registration**

  Servers register themselves with details such as name, version, and environment. No manual setup required.

- **Heartbeat system ♥**

  Servers periodically send heartbeat requests containing live data like player counts and status.

- **Player session tracking**

  Tracks player sessions with rich metadata: `uuid`, `username`, `joinedAt`, and `vanished`.
  - Supports vanish systems, so staff or hidden players can be excluded from public counts.

- **Global player aggregation**

  Player counts from all servers are combined and distributed via Redis pub/sub.
  - Enables real-time features like lobby sidebars showing total online players without direct API calls.
  - Vanished players can thus be excluded from public statistics.

- **Downtime detection**

  Scheduled checks detect when servers go offline by monitoring missed heartbeat intervals.

- **Clean, modular design**

  Built with asynchronous patterns and a modern toolset:
  - Guice for dependency injection
  - Retrofit2 for HTTP client communication
  - Jackson for serialization
  - Caffeine for efficient caching

## What This Is Not

- Not meant to be a plug-and-play (yet) — setup is required
- No metrics system (yet)
- Currently being built as a foundation for future expansion

## Requirements
Tech stack is shown below, but of course, the following is required:
1. MySQL
2. Redis
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

## Future Plans
1. Metrics to track A) server uptime and downtime, B) player session activity
2. Dockerize the environment to aid with install
4. CI/CD and GitHub Actions
5. Support for PostgreSQL
6. More configuration options
7. Possible: React panel as an addon feature
