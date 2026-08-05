<p align="center">
  <img src="frontend/public/favicon.svg" width="80" alt="PULSE Logo" />
</p>

<h1 align="center">🏭 PULSE — Factory Monitoring System</h1>

<p align="center">
  <b>Real-time factory floor monitoring with live telemetry, alerts, and analytics</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Spring%20Boot-3.3.2-6DB33F?style=for-the-badge&logo=spring-boot" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk" alt="Java 21" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
</p>

---

## 📖 Overview

**PULSE** (Plant Unified Live Surveillance Engine) is a full-stack factory monitoring system that provides real-time visibility into machine health, telemetry data, and operational alerts on the factory floor. It features a **Spring Boot** backend with **WebSocket** support for live data streaming and a **React + TypeScript** frontend with interactive dashboards and charts.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔴 **Live Dashboard** | Real-time KPI panels showing machine statuses at a glance |
| 📡 **WebSocket Streaming** | Persistent connections for instant telemetry updates |
| 📊 **Telemetry Charts** | Interactive charts for temperature, vibration, pressure & power consumption |
| 🚨 **Alert System** | Severity-based alerts (INFO / WARNING / CRITICAL) with resolution tracking |
| 🖥️ **Machine Detail View** | Drill-down view for individual machine telemetry and history |
| 🔄 **Telemetry Simulator** | Built-in simulator for demo/testing without physical hardware |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Dashboard │  │ Machine  │  │  Alert   │  │    KPI     │  │
│  │   View   │  │  Detail  │  │  Center  │  │   Panel    │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       │              │             │              │          │
│  ┌────┴──────────────┴─────────────┴──────────────┴──────┐  │
│  │          REST Client (Axios) + WebSocket Client        │  │
│  └───────────────────────┬───────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────┘
                           │  HTTP / WebSocket
┌──────────────────────────┼──────────────────────────────────┐
│                  Backend (Spring Boot 3.3)                    │
│  ┌───────────────────────┴───────────────────────────────┐  │
│  │        REST Controllers  +  WebSocket Handler          │  │
│  └───────────────────────┬───────────────────────────────┘  │
│  ┌───────────────────────┴───────────────────────────────┐  │
│  │                    Service Layer                        │  │
│  └───────────────────────┬───────────────────────────────┘  │
│  ┌───────────────────────┴───────────────────────────────┐  │
│  │              JPA Repository Layer (Hibernate)          │  │
│  └───────────────────────┬───────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │  MySQL 8.0  │
                    └─────────────┘
```

---

## 🛠️ Tech Stack

### Backend
- **Java 21** with **Spring Boot 3.3.2**
- **Spring Data JPA** — ORM and data access
- **Spring WebSocket** — Real-time bidirectional communication
- **Spring Actuator** — Health checks & monitoring endpoints
- **Lombok** — Boilerplate reduction
- **MySQL 8.0** — Relational database
- **HikariCP** — High-performance connection pooling

### Frontend
- **React 19** with **TypeScript 6**
- **Vite 8** — Lightning-fast build tool
- **React Router DOM 7** — Client-side routing
- **Recharts 3** — Composable charting library
- **Axios** — HTTP client

### Infrastructure
- **Docker Compose** — MySQL containerized setup
- **Maven** — Backend build & dependency management

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Java | 21+ |
| Node.js | 18+ |
| MySQL | 8.0+ (or Docker) |
| Maven | 3.9+ |

### 1. Clone the Repository

```bash
git clone https://github.com/Ragupathi1829/Fac-mon.git
cd Fac-mon
```

### 2. Set Up the Database

**Option A — Using Docker (Recommended):**

```bash
cd database
docker-compose up -d
```

This starts a MySQL 8.0 instance with:
- Database: `factory_db`
- User: `factory_user` / Password: `factory_password`
- Port: `3306`

**Option B — Manual MySQL Setup:**

```sql
CREATE DATABASE factory_monitoring;
```

Then run the schema file:

```bash
mysql -u root -p factory_monitoring < database/schema.sql
```

### 3. Configure the Backend

Update `backend/src/main/resources/application.yml` with your database credentials:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/factory_monitoring?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
    username: root
    password: your_password
```

### 4. Start the Backend

```bash
cd backend
./mvnw spring-boot:run
```

The backend starts on **http://localhost:8080**.

### 5. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on **http://localhost:5173**.

---

## 📡 API Endpoints

### Machines

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/machines` | List all machines |
| `GET` | `/api/machines/{id}` | Get machine by ID |
| `POST` | `/api/machines` | Register a new machine |
| `PATCH` | `/api/machines/{id}` | Update machine details |

### Telemetry

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/telemetry` | Get telemetry logs |
| `GET` | `/api/telemetry/machine/{id}` | Get telemetry for a specific machine |
| `POST` | `/api/telemetry` | Submit telemetry data |

### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/alerts` | List all alerts |
| `GET` | `/api/alerts/machine/{id}` | Get alerts for a specific machine |
| `PATCH` | `/api/alerts/{id}/resolve` | Resolve an alert |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/summary` | Get dashboard KPIs |

### WebSocket

| Protocol | Endpoint | Description |
|----------|----------|-------------|
| `WS` | `/ws/telemetry` | Live telemetry stream |

### Actuator

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/actuator/health` | Application health check |
| `GET` | `/actuator/info` | Application info |

---

## 📁 Project Structure

```
Fac-mon/
├── backend/                          # Spring Boot backend
│   ├── src/main/java/com/factory/monitoring/
│   │   ├── config/                   # CORS, WebSocket, DataInitializer configs
│   │   ├── controller/               # REST API controllers
│   │   ├── domain/                   # JPA entity classes
│   │   ├── dto/                      # Data Transfer Objects
│   │   ├── exception/                # Global exception handling
│   │   ├── repository/               # Spring Data JPA repositories
│   │   ├── service/                  # Business logic interfaces
│   │   │   └── impl/                 # Service implementations
│   │   └── websocket/                # WebSocket handler & telemetry simulator
│   ├── src/main/resources/
│   │   └── application.yml           # Application configuration
│   └── pom.xml                       # Maven dependencies
│
├── frontend/                         # React + TypeScript frontend
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   │   ├── AlertCenter.tsx       # Real-time alert feed
│   │   │   ├── KpiPanel.tsx          # KPI summary cards
│   │   │   ├── MachineCard.tsx       # Individual machine card
│   │   │   ├── MachineGrid.tsx       # Machine overview grid
│   │   │   └── Navbar.tsx            # Navigation bar
│   │   ├── views/                    # Page-level views
│   │   │   ├── Dashboard.tsx         # Main dashboard page
│   │   │   └── MachineDetailView.tsx # Machine detail page
│   │   ├── context/                  # React Context state management
│   │   ├── hooks/                    # Custom hooks (WebSocket)
│   │   ├── services/                 # API & WebSocket service clients
│   │   ├── types/                    # TypeScript type definitions
│   │   └── App.tsx                   # Root application component
│   ├── package.json
│   └── vite.config.ts
│
├── database/
│   ├── docker-compose.yml            # MySQL Docker setup
│   └── schema.sql                    # Database schema (3 tables)
│
├── docs/
│   └── ARCHITECTURE.md               # System architecture documentation
│
└── README.md
```

---

## 🗄️ Database Schema

The system uses **3 core tables**:

| Table | Description |
|-------|-------------|
| `machines` | Machine registry with code, name, type, status, and location |
| `telemetry_logs` | Time-series sensor data (temperature, vibration, pressure, power) |
| `alerts` | Severity-based alerts with resolution tracking |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/Ragupathi1829">Ragupathi</a>
</p>
