# Factory Monitoring System Architecture

This document describes the high-level system architecture and standard dataflows for the Factory Monitoring System.

## Architecture Overview

```mermaid
graph TD
    subgraph Frontend (React + TS + Vite)
        UI[Dashboard UI]
        WS_Client[WebSocket Client]
        HTTP_Client[REST Client]
    end

    subgraph Backend (Spring Boot 3.x + Java 21)
        API_Ctrl[REST Controllers]
        WS_Hndlr[WebSocket Handler]
        Svc_Layer[Service Layer]
        Repo_Layer[JPA Repository Layer]
    end

    subgraph Database
        DB[(MySQL Database)]
    end

    UI --> HTTP_Client
    UI --> WS_Client

    HTTP_Client -- HTTP GET/POST/PATCH --> API_Ctrl
    WS_Client -- WS Connection --> WS_Hndlr

    API_Ctrl --> Svc_Layer
    WS_Hndlr --> Svc_Layer
    Svc_Layer --> Repo_Layer
    Repo_Layer --> DB
```

## Layers and Package Structure

### 1. Presentation Layer
- **`com.factory.monitoring.controller`**: Handles incoming HTTP requests and responses. Uses standard DTO mapping.
- **`com.factory.monitoring.websocket`**: Handles real-time persistent WebSocket connections for live telemetry streams.

### 2. Business Logic Layer
- **`com.factory.monitoring.service`**: Encapsulates transaction logic and business workflows. Interface-driven structure.

### 3. Data Access Layer
- **`com.factory.monitoring.repository`**: Abstracts database querying using Spring Data JPA.

### 4. Domain Layer
- **`com.factory.monitoring.domain`**: Represents persistence entities mapped directly to MySQL tables.

### 5. Cross-Cutting Concerns
- **`com.factory.monitoring.config`**: Core Spring, Cors, and WebSocket infrastructure configurations.
- **`com.factory.monitoring.dto`**: Data structures optimized for network transfer.
- **`com.factory.monitoring.exception`**: Unified global exception handling.
