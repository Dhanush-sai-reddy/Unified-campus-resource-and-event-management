# HackOverflow — Campus Management System

<div align="center">
  <h3>Unified Campus Resource & Event Management Platform</h3>
  <p>Microservices-based architecture for high-performance scheduling and real-time collaboration.</p>
</div>

---

## Overview

**HackOverflow** is a comprehensive campus management system designed to streamline the scheduling of resources (labs, auditoriums, classrooms) and events. It solves common conflicts and data consistency issues through a robust **Microservices Architecture**.

The system features a high-performance **Go-based Scheduler** for conflict detection, a flexible **Node.js API** for business logic, and a dynamic **React Frontend** with a custom-built calendar engine.

## Key Features

-   **Microservices Ecosystem**: Decoupled services for API (Node.js) and Scheduling (Go), ensuring scalability and fault tolerance.
-   **High-Resolution Conflict Detection**: Uses **Interval Trees** in Go to process 500+ overlapping booking queries in under 10ms.
-   **Real-time Collaboration**: Integrated **Socket.io** to enable instant peer-to-peer chat and team communication.
-   **Custom Calendar Engine**: A scratch-built drag-and-drop interface in React for intuitive time-slot selection and resource visualization.
-   **Optimized Data Flow**: Efficient Nginx Reverse Proxy routing and atomic database transactions using PostgreSQL.

## Tech Stack

### Frontend
-   **Framework**: React (Vite)
-   **Styling**: TailwindCSS
-   **State/Interactions**: Framer Motion, Socket.io Client
-   **Visualization**: Recharts, Custom Calendar Components

### Backend API
-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: PostgreSQL (via Prisma ORM)
-   **Authentication**: JWT, BCrypt
-   **Real-time**: Socket.io

### Scheduler Service
-   **Language**: Go (Golang)
-   **Framework**: Fiber
-   **Algorithm**: Interval Trees for overlapping time query optimization

### DevOps & Infrastructure
-   **Containerization**: Docker & Docker Compose
-   **Proxy**: Nginx
-   **Database**: PostgreSQL

## Architecture

```mermaid
graph TD
    Client[Client (React)] <-->|WebSocket/HTTP| Nginx[Nginx Reverse Proxy]
    Nginx <-->|/api| NodeService[Node.js API Service]
    Nginx <-->|/scheduler| GoService[Go Scheduler Service]
    
    NodeService -->|Read/Write| DB[(PostgreSQL)]
    GoService -->|Read-Only/Validation| DB
    
    NodeService <-->|Sync| GoService
```

## Getting Started

### Prerequisites
-   **Docker** & **Docker Compose**
-   **Node.js** (v18+)
-   **Go** (v1.21+)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Dhanush-sai-reddy/hackoverflow.git
    cd hackoverflow/campus-system
    ```

2.  **Environment Setup**
    Copy the example environment files:
    ```bash
    cp .env.example .env
    ```

3.  **Run with Docker (Recommended)**
    Build and start all services via Docker Compose:
    ```bash
    docker-compose up --build
    ```
    This will spin up the Postgres DB, API, Scheduler, and Frontend containers.

4.  **Local Development**
    If running services individually:
    
    *   **Database**: `docker-compose up -d postgres`
    *   **API**: `cd api && npm install && npm run dev`
    *   **Scheduler**: `cd scheduler && go run main.go`
    *   **Frontend**: `cd web && npm install && npm run dev`

### Access
-   **Frontend**: http://localhost:5173
-   **API Endpoints**: http://localhost:3000

## License
MIT License.
