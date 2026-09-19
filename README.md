# VAYRO — Vehicle Rental & Fleet Management Platform

VAYRO is a cloud-native, microservices-based vehicle rental and fleet management platform engineered for enterprise scalability, reliability, and security.

---

## 📁 Repository Architecture

```
VAYRO/
├── frontend/                     # React 18 / Vite SPA Client Application
│   ├── src/                      # Components, Pages, Routes, Context, Hooks, Services
│   ├── public/                   # Static public assets
│   ├── index.html                # Entry HTML
│   ├── vite.config.js            # Vite build & proxy configuration
│   ├── package.json              # Frontend dependencies & scripts
│   ├── Dockerfile                # Multi-stage production container build
│   └── nginx.conf                # Nginx reverse proxy configuration
│
├── backend/
│   └── vayro-backend/            # Spring Boot 3.4.3 & Java 21 Microservices
│       ├── pom.xml               # Root Maven multi-module reactor
│       ├── eureka-server/        # Spring Cloud Netflix Eureka Service Discovery (:8761)
│       ├── api-gateway/          # Spring Cloud Reactive API Gateway (:8080)
│       ├── user-service/         # User Management, Auth & Google OAuth (:8081)
│       ├── vehicle-service/      # 207-Vehicle Fleet Catalogue & Search (:8082)
│       ├── booking-service/      # Booking Lifecycle, Overlap Prevention & Pricing (:8083)
│       └── notification-service/ # Async Email Notifications & PDF Invoice Generation (:8084)
│
├── docker-compose.yml            # Local & production Docker orchestration
├── .env.example                  # Environment configuration template
├── .gitignore                    # Git security & artifact ignore rules
└── README.md                     # Project documentation
```

---

## 🚀 Quick Start

### 1. Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### 2. Backend Development

Ensure Java 21+ and Maven are installed, then run the services:

```bash
cd backend/vayro-backend

# Build & run test suite
mvn clean test

# Run individual microservices
mvn spring-boot:run -pl eureka-server
mvn spring-boot:run -pl api-gateway
mvn spring-boot:run -pl user-service
mvn spring-boot:run -pl vehicle-service
mvn spring-boot:run -pl booking-service
mvn spring-boot:run -pl notification-service
```

### 3. Docker Compose

```bash
docker-compose up --build
```
