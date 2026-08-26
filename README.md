<p align="center">
  <img src="frontend/public/favicon.svg" width="80" alt="SmartFactory 360 Logo" />
</p>

<h1 align="center">🏭 SmartFactory 360 — Advanced Factory Monitoring System</h1>

<p align="center">
  <b>Industry 4.0 real-time factory floor monitoring with live telemetry, digital twins, AI insights, and sustainability tracking</b>
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

**SmartFactory 360** (formerly PULSE) is a state-of-the-art Industry 4.0 full-stack factory monitoring system. It provides real-time visibility into machine health, telemetry data, and operational alerts on the factory floor while introducing advanced capabilities like Role-Based Access Control (RBAC), a Digital Twin Floor Map, AI Predictions, a Sustainability Dashboard, and Resource Planners. 

It features a robust **Spring Boot** backend with secure **JWT Authentication** and **WebSocket** support, alongside a responsive **React + TypeScript** frontend with interactive dashboards.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **RBAC & Authentication** | Secure login, role-based access control (Admin, Manager, Operator), OTP verification, and comprehensive User Profiles |
| 🔴 **Live Dashboard & Digital Twin** | Real-time KPI panels and an interactive Floor Map showing live machine statuses and locations |
| 🤖 **AI Assistant & Predictions** | Integrated AI Chat Assistant providing operational insights, quick actions, and predictive maintenance |
| ♻️ **Sustainability Dashboard** | Monitor factory energy consumption, carbon footprint, water usage, and resource efficiency over time |
| 📡 **WebSocket Streaming** | Persistent connections for instant telemetry updates and alert notifications |
| 📊 **Telemetry Charts** | Interactive charting for temperature, vibration, pressure, & power consumption metrics |
| 🚨 **Alert System** | Severity-based alerts (INFO / WARNING / CRITICAL) with real-time push and resolution tracking |
| 📋 **Resource Planners** | Dedicated modules for Workers Management, Maintenance Inventory, and a Document Center |

---

## 🏗️ Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌─────────┐ │
│  │ Dashboard │  │ Digital  │  │  Alert   │  │   Sustain- │  │  AI     │ │
│  │   View   │  │   Twin   │  │  Center  │  │   ability  │  │Assistant│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  └────┬────┘ │
│       │              │             │              │             │      │
│  ┌────┴──────────────┴─────────────┴──────────────┴─────────────┴────┐ │
│  │               REST Client (Axios) + WebSocket Client              │ │
│  └───────────────────────┬───────────────────────────────┬───────────┘ │
└──────────────────────────┼───────────────────────────────┼─────────────┘
                           │  HTTP / WebSocket             │ HTTP (JWT)
┌──────────────────────────┼───────────────────────────────┼─────────────┐
│                       Backend (Spring Boot 3.3)                        │
│  ┌───────────────────────┴───────────────────────────────┴───────────┐ │
│  │    REST Controllers (Auth, Telemetry, Profiles, Alerts, etc.)     │ │
│  │                      + WebSocket Handler                          │ │
│  └───────────────────────┬───────────────────────────────┬───────────┘ │
│  ┌───────────────────────┴───────────────────────────────┴───────────┐ │
│  │     Service Layer (Security, RBAC, Telemetry, OTP, AI logic)      │ │
│  └───────────────────────┬───────────────────────────────┬───────────┘ │
│  ┌───────────────────────┴───────────────────────────────┴───────────┐ │
│  │                  JPA Repository Layer (Hibernate)                 │ │
│  └───────────────────────┬───────────────────────────────────────────┘ │
└──────────────────────────┼─────────────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │  MySQL 8.0  │
                    └─────────────┘
```

---

## 🛠️ Tech Stack

### Backend
- **Java 21** with **Spring Boot 3.3.2**
- **Spring Security & JWT** — Secure authentication and API protection
- **Spring Data JPA** — ORM and data access
- **Spring WebSocket** — Real-time bidirectional communication
- **Twilio API** — For OTP and SMS-based verification flows
- **MySQL 8.0** — Relational database
- **HikariCP** — High-performance connection pooling

### Frontend
- **React 19** with **TypeScript 6**
- **Vite 8** — Lightning-fast build tool
- **React Router DOM 7** — Client-side routing
- **Recharts 3** — Composable charting library
- **Axios** — HTTP client

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
- Database: `factory_monitoring`
- Port: `3306`

**Option B — Manual MySQL Setup:**

```sql
CREATE DATABASE factory_monitoring;
```

Then run the schema initialization (or let Spring Boot Auto DDL handle it).

### 3. Configure the Backend

The backend utilizes **Spring Profiles** to manage configurations cleanly. By default, it runs on the `local` profile. Configure environment variables or override the properties in `backend/src/main/resources/application.yml` (or create an `application-local.yml`):

```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:mysql://localhost:3306/factory_monitoring?useSSL=false}
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:your_password}
```

*Note: For OTP features, configure your Twilio credentials in the environment or properties.*

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

The frontend starts on **http://localhost:5173** (or 5174).

---

## 📡 API Endpoints

### Authentication & Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Authenticate user and get JWT |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/otp/verify` | Verify OTP |
| `GET` | `/api/profile/{id}` | Get user profile details |

### Machines
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/machines` | List all machines |
| `GET` | `/api/machines/{id}` | Get machine by ID |
| `POST` | `/api/machines` | Register a new machine |
| `PATCH` | `/api/machines/{id}` | Update machine details |

### Telemetry & Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/telemetry/machine/{id}` | Get telemetry history for a machine |
| `GET` | `/api/dashboard/summary` | Get aggregated dashboard KPIs |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/alerts` | List all alerts |
| `PATCH` | `/api/alerts/{id}/resolve` | Resolve an alert |

### WebSocket
| Protocol | Endpoint | Description |
|----------|----------|-------------|
| `WS` | `/ws/telemetry` | Live telemetry & alerts stream |

---

## 📁 Project Structure

```text
Fac-mon/
├── backend/                          # Spring Boot backend
│   ├── src/main/java/com/factory/monitoring/
│   │   ├── config/                   # CORS, Security, WebSocket, DataInitializer
│   │   ├── controller/               # REST API (Auth, Machine, Profile, Alerts, etc.)
│   │   ├── domain/                   # JPA entities (User, Machine, Alert, TelemetryLog)
│   │   ├── exception/                # Global exception handling
│   │   ├── repository/               # Spring Data JPA repositories
│   │   ├── service/                  # Business logic (RBAC, Telemetry, OTP, AI logic)
│   │   └── websocket/                # WebSocket handler & telemetry simulator
│   └── src/main/resources/           # App config (application.yml, application-prod.yml)
│
├── frontend/                         # React + TypeScript frontend
│   ├── src/
│   │   ├── components/               # UI components (ChatAssistant, FloorMap, RegisterModal)
│   │   ├── views/                    # Views (Dashboard, Profile, Sustainability, Maintenance)
│   │   ├── context/                  # React Context state management
│   │   ├── services/                 # API & WebSocket service clients
│   │   ├── types/                    # TypeScript type definitions
│   │   └── App.tsx                   # Root application component
│   └── package.json
│
├── database/
│   ├── docker-compose.yml            # MySQL Docker setup
│   └── schema.sql                    # Initial database schema
│
├── docs/
│   └── ARCHITECTURE.md               # System architecture documentation
│
└── README.md
```

---

## 🗄️ Database Schema

The system uses Several core tables to model the factory:

| Table | Description |
|-------|-------------|
| `users` & `user_roles`| User accounts, credentials, profiles, and RBAC mapping |
| `otp_verifications` | One-Time Password tracking for secured actions |
| `machines` | Machine registry with codes, types, statuses, and locations |
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
  Built with  by <a href="https://github.com/Ragupathi1829">Ragupathi</a>
</p>
