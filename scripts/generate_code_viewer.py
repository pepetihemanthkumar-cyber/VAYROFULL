import os
import json
import re

categories = [
    {
        "id": "cat_01",
        "title": "01. PROJECT ARCHITECTURE",
        "icon": "🏗️",
        "files": [
            {
                "path": "README.md",
                "name": "README.md",
                "lang": "markdown",
                "facultyOrder": 1,
                "importance": "Master repository architecture detailing multi-module microservice organization, service ports (:8761, :8080, :8081, :8082, :8083, :8084), and runtime setup."
            },
            {
                "path": "backend/vayro-backend/pom.xml",
                "name": "Root pom.xml",
                "lang": "xml",
                "importance": "Root Maven reactor coordinating Spring Boot 3.4.3 parent and all microservice modules (eureka-server, api-gateway, user-service, vehicle-service, booking-service, notification-service)."
            },
            {
                "path": "backend/vayro-backend/eureka-server/pom.xml",
                "name": "eureka-server/pom.xml",
                "lang": "xml",
                "importance": "Eureka Discovery Server Maven dependencies (spring-cloud-starter-netflix-eureka-server)."
            },
            {
                "path": "backend/vayro-backend/api-gateway/pom.xml",
                "name": "api-gateway/pom.xml",
                "lang": "xml",
                "importance": "Spring Cloud Reactive Gateway & WebFlux Security dependencies."
            },
            {
                "path": "backend/vayro-backend/user-service/pom.xml",
                "name": "user-service/pom.xml",
                "lang": "xml",
                "importance": "User Service dependencies including JJWT 0.12.6, Spring Security, BCrypt, and PostgreSQL JPA."
            },
            {
                "path": "backend/vayro-backend/booking-service/pom.xml",
                "name": "booking-service/pom.xml",
                "lang": "xml",
                "importance": "Booking Service dependencies with Spring Cloud LoadBalancer and Eureka Client."
            }
        ]
    },
    {
        "id": "cat_02",
        "title": "02. EUREKA SERVICE DISCOVERY",
        "icon": "📡",
        "files": [
            {
                "path": "backend/vayro-backend/eureka-server/src/main/java/com/vayro/eureka/EurekaServerApplication.java",
                "name": "EurekaServerApplication.java",
                "lang": "java",
                "facultyOrder": 1,
                "importance": "Eureka Service Discovery Registry entry point annotated with @EnableEurekaServer running on port 8761."
            },
            {
                "path": "backend/vayro-backend/eureka-server/src/main/resources/application.yml",
                "name": "eureka-server application.yml",
                "lang": "yaml",
                "importance": "Configures standalone Eureka Server on port 8761 with self-preservation settings and lease eviction."
            },
            {
                "path": "backend/vayro-backend/api-gateway/src/main/resources/application.yml",
                "name": "api-gateway application.yml",
                "lang": "yaml",
                "facultyOrder": 2,
                "importance": "Registers API Gateway with Eureka and defines load-balanced routing to downstream microservices using lb:// prefixes."
            },
            {
                "path": "backend/vayro-backend/user-service/src/main/resources/application.yml",
                "name": "user-service application.yml",
                "lang": "yaml",
                "facultyOrder": 3,
                "importance": "Declares USER-SERVICE instance registration on port 8081 pointing to Eureka defaultZone."
            },
            {
                "path": "backend/vayro-backend/vehicle-service/src/main/resources/application.yml",
                "name": "vehicle-service application.yml",
                "lang": "yaml",
                "importance": "Declares VEHICLE-SERVICE instance registration on port 8082 pointing to Eureka defaultZone."
            },
            {
                "path": "backend/vayro-backend/booking-service/src/main/resources/application.yml",
                "name": "booking-service application.yml",
                "lang": "yaml",
                "importance": "Declares BOOKING-SERVICE instance registration on port 8083 pointing to Eureka defaultZone."
            },
            {
                "path": "backend/vayro-backend/notification-service/src/main/resources/application.yml",
                "name": "notification-service application.yml",
                "lang": "yaml",
                "importance": "Declares NOTIFICATION-SERVICE instance registration on port 8084 pointing to Eureka defaultZone."
            },
            {
                "path": "backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/config/RestClientConfig.java",
                "name": "RestClientConfig.java",
                "lang": "java",
                "facultyOrder": 8,
                "importance": "Configures @Bean @LoadBalanced RestClient.Builder enabling inter-service resolution via Eureka logical hostnames."
            }
        ]
    },
    {
        "id": "cat_03",
        "title": "03. JWT AUTHENTICATION",
        "icon": "🔐",
        "files": [
            {
                "path": "backend/vayro-backend/user-service/src/main/java/com/vayro/users/controller/AuthController.java",
                "name": "AuthController.java (User Service)",
                "lang": "java",
                "facultyOrder": 4,
                "importance": "Exposes public POST /api/auth/register, POST /api/auth/login, and POST /api/auth/google endpoints returning JWT tokens."
            },
            {
                "path": "backend/vayro-backend/user-service/src/main/java/com/vayro/users/service/AuthService.java",
                "name": "AuthService.java (User Service)",
                "lang": "java",
                "facultyOrder": 4,
                "importance": "Validates user credentials via BCrypt passwordEncoder.matches(), loads user details, and triggers JWT generation."
            },
            {
                "path": "backend/vayro-backend/user-service/src/main/java/com/vayro/users/security/JwtService.java",
                "name": "JwtService.java (User Service)",
                "lang": "java",
                "facultyOrder": 4,
                "importance": "Constructs signed HMAC-SHA256 JWT tokens with custom claims (userId, role, name, subject)."
            },
            {
                "path": "backend/vayro-backend/user-service/src/main/java/com/vayro/users/security/JwtAuthenticationFilter.java",
                "name": "JwtAuthenticationFilter.java (User Service)",
                "lang": "java",
                "importance": "OncePerRequestFilter intercepting Authorization Bearer headers to populate SecurityContextHolder in User Service."
            },
            {
                "path": "backend/vayro-backend/user-service/src/main/java/com/vayro/users/config/SecurityConfig.java",
                "name": "SecurityConfig.java (User Service)",
                "lang": "java",
                "facultyOrder": 5,
                "importance": "Stateless Spring Security FilterChain configuring BCryptPasswordEncoder, public auth matchers, and JWT filter."
            },
            {
                "path": "backend/vayro-backend/user-service/src/main/java/com/vayro/users/entity/User.java",
                "name": "User.java (Entity)",
                "lang": "java",
                "importance": "JPA entity mapping user accounts, hashed passwords, roles, and timestamps in PostgreSQL."
            },
            {
                "path": "backend/vayro-backend/user-service/src/main/java/com/vayro/users/repository/UserRepository.java",
                "name": "UserRepository.java",
                "lang": "java",
                "importance": "Spring Data JPA repository providing findByEmail, existsByEmail queries for authentication."
            },
            {
                "path": "backend/vayro-backend/user-service/src/main/java/com/vayro/users/entity/Role.java",
                "name": "Role.java (Enum)",
                "lang": "java",
                "importance": "Enumeration defining Role-Based Access Control levels: USER and ADMIN."
            },
            {
                "path": "backend/vayro-backend/user-service/src/main/java/com/vayro/users/controller/UserController.java",
                "name": "UserController.java",
                "lang": "java",
                "importance": "Protected endpoint GET /api/users/me returning the authenticated principal profile."
            }
        ]
    },
    {
        "id": "cat_04",
        "title": "04. API GATEWAY",
        "icon": "🚪",
        "files": [
            {
                "path": "backend/vayro-backend/api-gateway/src/main/java/com/vayro/gateway/ApiGatewayApplication.java",
                "name": "ApiGatewayApplication.java",
                "lang": "java",
                "facultyOrder": 2,
                "importance": "Main application class for Spring Cloud Gateway running on port 8080."
            },
            {
                "path": "backend/vayro-backend/api-gateway/src/main/java/com/vayro/gateway/config/SecurityConfig.java",
                "name": "SecurityConfig.java (API Gateway)",
                "lang": "java",
                "facultyOrder": 5,
                "importance": "Reactive WebFlux SecurityFilterChain defining route authorization, public endpoints, and CORS WebFilter."
            },
            {
                "path": "backend/vayro-backend/api-gateway/src/main/java/com/vayro/gateway/security/JwtService.java",
                "name": "JwtService.java (API Gateway)",
                "lang": "java",
                "facultyOrder": 4,
                "importance": "Edge JWT validator checking HMAC signature and expiration before requests proceed downstream."
            },
            {
                "path": "backend/vayro-backend/api-gateway/src/main/java/com/vayro/gateway/security/JwtReactiveAuthenticationManager.java",
                "name": "JwtReactiveAuthenticationManager.java",
                "lang": "java",
                "importance": "Reactive AuthenticationManager extracting roles (ROLE_USER, ROLE_ADMIN) and creating UsernamePasswordAuthenticationToken."
            },
            {
                "path": "backend/vayro-backend/api-gateway/src/main/java/com/vayro/gateway/security/JwtServerAuthenticationConverter.java",
                "name": "JwtServerAuthenticationConverter.java",
                "lang": "java",
                "importance": "ServerAuthenticationConverter extracting Bearer token from ServerWebExchange HTTP headers."
            },
            {
                "path": "backend/vayro-backend/api-gateway/src/main/java/com/vayro/gateway/filter/LoggingGlobalFilter.java",
                "name": "LoggingGlobalFilter.java",
                "lang": "java",
                "importance": "GlobalFilter intercepting every request and response to log HTTP method, path, and status code."
            }
        ]
    },
    {
        "id": "cat_05",
        "title": "05. MICROSERVICES",
        "icon": "⚙️",
        "files": [
            {
                "path": "backend/vayro-backend/user-service/src/main/java/com/vayro/users/UserServiceApplication.java",
                "name": "UserServiceApplication.java",
                "lang": "java",
                "importance": "Spring Boot application entry point for USER-SERVICE."
            },
            {
                "path": "backend/vayro-backend/vehicle-service/src/main/java/com/vayro/vehicles/VehicleServiceApplication.java",
                "name": "VehicleServiceApplication.java",
                "lang": "java",
                "facultyOrder": 6,
                "importance": "Spring Boot application entry point for VEHICLE-SERVICE."
            },
            {
                "path": "backend/vayro-backend/vehicle-service/src/main/java/com/vayro/vehicles/controller/VehicleController.java",
                "name": "VehicleController.java",
                "lang": "java",
                "facultyOrder": 6,
                "importance": "REST Controller for fleet catalogue search, multi-field filtering, and status mutations."
            },
            {
                "path": "backend/vayro-backend/vehicle-service/src/main/java/com/vayro/vehicles/service/VehicleService.java",
                "name": "VehicleService.java",
                "lang": "java",
                "importance": "Business service managing 207-vehicle catalogue, availability status transitions, and dynamic specifications."
            },
            {
                "path": "backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/BookingServiceApplication.java",
                "name": "BookingServiceApplication.java",
                "lang": "java",
                "facultyOrder": 7,
                "importance": "Spring Boot application entry point for BOOKING-SERVICE."
            },
            {
                "path": "backend/vayro-backend/notification-service/src/main/java/com/vayro/notification/NotificationServiceApplication.java",
                "name": "NotificationServiceApplication.java",
                "lang": "java",
                "facultyOrder": 9,
                "importance": "Spring Boot application entry point for NOTIFICATION-SERVICE."
            }
        ]
    },
    {
        "id": "cat_06",
        "title": "06. DATABASE (JPA / POSTGRESQL)",
        "icon": "🗄️",
        "files": [
            {
                "path": "backend/vayro-backend/user-service/src/main/java/com/vayro/users/entity/User.java",
                "name": "User.java (Entity)",
                "lang": "java",
                "importance": "Maps relational users table with unique email, hashed password, and role enum."
            },
            {
                "path": "backend/vayro-backend/vehicle-service/src/main/java/com/vayro/vehicles/entity/Vehicle.java",
                "name": "Vehicle.java (Entity)",
                "lang": "java",
                "importance": "Maps vehicles table with brand, model, daily price, features, category, and status."
            },
            {
                "path": "backend/vayro-backend/vehicle-service/src/main/java/com/vayro/vehicles/repository/VehicleRepository.java",
                "name": "VehicleRepository.java",
                "lang": "java",
                "importance": "Spring Data JPA repository with JpaSpecificationExecutor for complex dynamic fleet filters."
            },
            {
                "path": "backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/entity/Booking.java",
                "name": "Booking.java (Entity)",
                "lang": "java",
                "importance": "Maps bookings table with pickup/return timestamps, financial calculations, add-ons, and payment references."
            },
            {
                "path": "backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/repository/BookingRepository.java",
                "name": "BookingRepository.java",
                "lang": "java",
                "importance": "Spring Data repository with custom JPQL interval overlap queries to prevent double-booking."
            },
            {
                "path": "backend/vayro-backend/notification-service/src/main/java/com/vayro/notification/entity/Notification.java",
                "name": "Notification.java (Entity)",
                "lang": "java",
                "importance": "Maps notification_logs table for audit tracking and idempotency key checks."
            }
        ]
    },
    {
        "id": "cat_07",
        "title": "07. BOOKING & OVERLAP LOGIC",
        "icon": "📅",
        "files": [
            {
                "path": "backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/controller/BookingController.java",
                "name": "BookingController.java",
                "lang": "java",
                "facultyOrder": 7,
                "importance": "Exposes POST /api/bookings and GET /api/bookings/my, binding authenticated principal to new reservations."
            },
            {
                "path": "backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/service/BookingServiceImpl.java",
                "name": "BookingServiceImpl.java",
                "lang": "java",
                "facultyOrder": 7,
                "importance": "Core reservation workflow: validates vehicle via VehicleServiceClient, checks zero overlap, calculates 18% GST tax, saves booking, and dispatches async notification."
            },
            {
                "path": "backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/repository/BookingRepository.java",
                "name": "BookingRepository.java (Overlap Query)",
                "lang": "java",
                "facultyOrder": 7,
                "importance": "JPQL query enforcing interval overlap condition: existing.pickupDateTime < requestedReturn AND existing.returnDateTime > requestedPickup."
            },
            {
                "path": "backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/client/VehicleServiceClientImpl.java",
                "name": "VehicleServiceClientImpl.java",
                "lang": "java",
                "facultyOrder": 8,
                "importance": "Synchronous LoadBalanced client querying http://VEHICLE-SERVICE/api/vehicles/{id} to verify fleet availability."
            },
            {
                "path": "backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/client/NotificationServiceClientImpl.java",
                "name": "NotificationServiceClientImpl.java",
                "lang": "java",
                "facultyOrder": 8,
                "importance": "Asynchronous client posting to http://NOTIFICATION-SERVICE/api/notifications/booking-confirmed."
            },
            {
                "path": "backend/vayro-backend/booking-service/src/main/java/com/vayro/booking/config/SecurityConfig.java",
                "name": "SecurityConfig.java (Booking Service)",
                "lang": "java",
                "importance": "Stateless security filter chain requiring authentication for booking creation and customer queries."
            }
        ]
    },
    {
        "id": "cat_08",
        "title": "08. NOTIFICATION & INVOICE",
        "icon": "📧",
        "files": [
            {
                "path": "backend/vayro-backend/notification-service/src/main/java/com/vayro/notification/controller/NotificationController.java",
                "name": "NotificationController.java",
                "lang": "java",
                "facultyOrder": 9,
                "importance": "Receives booking-confirmed and vehicle-returned notification payloads from Booking Service."
            },
            {
                "path": "backend/vayro-backend/notification-service/src/main/java/com/vayro/notification/service/NotificationServiceImpl.java",
                "name": "NotificationServiceImpl.java",
                "lang": "java",
                "facultyOrder": 9,
                "importance": "Handles idempotency, compiles HTML email templates, generates PDF invoice, and sends email."
            },
            {
                "path": "backend/vayro-backend/notification-service/src/main/java/com/vayro/notification/service/PdfInvoiceGenerator.java",
                "name": "PdfInvoiceGenerator.java",
                "lang": "java",
                "facultyOrder": 9,
                "importance": "Uses OpenPDF to dynamically render tax invoice with VAYRO branding, financial breakdown, and terms."
            },
            {
                "path": "backend/vayro-backend/notification-service/src/main/java/com/vayro/notification/provider/GmailEmailProvider.java",
                "name": "GmailEmailProvider.java",
                "lang": "java",
                "importance": "JavaMailSender wrapper sending MIME multipart emails with PDF attachments via Gmail SMTP."
            }
        ]
    },
    {
        "id": "cat_09",
        "title": "09. FRONTEND AUTHENTICATION",
        "icon": "💻",
        "files": [
            {
                "path": "frontend/src/context/AuthContext.jsx",
                "name": "AuthContext.jsx",
                "lang": "javascript",
                "facultyOrder": 10,
                "importance": "React Context managing global authentication state, session persistence in localStorage, and auto-restoration."
            },
            {
                "path": "frontend/src/services/authService.js",
                "name": "authService.js",
                "lang": "javascript",
                "facultyOrder": 10,
                "importance": "Client auth service calling POST /api/auth/login and POST /api/auth/register through API Gateway."
            },
            {
                "path": "frontend/src/services/api.js",
                "name": "api.js (Axios Interceptor)",
                "lang": "javascript",
                "facultyOrder": 10,
                "importance": "Configures Axios instance with request interceptor attaching Bearer JWT and response error handling."
            },
            {
                "path": "frontend/src/routes/ProtectedRoute.jsx",
                "name": "ProtectedRoute.jsx",
                "lang": "javascript",
                "importance": "React Router auth guard redirecting unauthenticated users to /login."
            },
            {
                "path": "frontend/src/pages/auth/LoginPage.jsx",
                "name": "LoginPage.jsx",
                "lang": "javascript",
                "importance": "VAYRO login UI with email/password authentication, Google OAuth button, and role-based redirect."
            },
            {
                "path": "frontend/vite.config.js",
                "name": "vite.config.js",
                "lang": "javascript",
                "importance": "Vite development proxy forwarding all /api client calls to API Gateway on port 8080."
            }
        ]
    }
]

secret_patterns = [
    (r"password:\s*[\"'\w!@#$%^&*()_+=-]+", "password: \"[REDACTED]\""),
    (r"MAIL_PASSWORD=[^\n\r]+", "MAIL_PASSWORD=[REDACTED]"),
    (r"JWT_SECRET=[^\n\r]+", "JWT_SECRET=[REDACTED]"),
    (r"GOOGLE_CLIENT_SECRET=[^\n\r]+", "GOOGLE_CLIENT_SECRET=[REDACTED]"),
    (r"jwt:\s*\n\s*secret:\s*[\"'\w!@#$%^&*()_+=\/]+", "jwt:\n    secret: \"[REDACTED]\""),
    (r"uzfrasxrmqzxjqtj", "[REDACTED]"),
    (r"WWfWACF\/ahjg8bRmG8WGZ6MKu\/c\+1H307AWH7Bra9A8=", "[REDACTED]"),
    (r"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", "[REDACTED]")
]

def sanitize(content):
    res = content
    for pat, repl in secret_patterns:
        res = re.sub(pat, repl, res)
    return res

loaded_categories = []
file_counter = 0

for cat in categories:
    loaded_files = []
    for f in cat["files"]:
        if os.path.exists(f["path"]):
            with open(f["path"], "r", encoding="utf-8", errors="ignore") as fh:
                raw = fh.read()
            clean = sanitize(raw)
            f_copy = dict(f)
            f_copy["code"] = clean
            f_copy["lineCount"] = len(clean.splitlines())
            f_copy["sizeBytes"] = len(clean)
            loaded_files.append(f_copy)
            file_counter += 1
        else:
            print(f"Warning: {f['path']} not found")
    cat_copy = dict(cat)
    cat_copy["files"] = loaded_files
    loaded_categories.append(cat_copy)

json_str = json.dumps(loaded_categories).replace("</script>", "<\\/script>")

out_path = "docs/review-1/code-viewer/index.html"
os.makedirs(os.path.dirname(out_path), exist_ok=True)

html_template = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VAYRO — Review 1 Source Code Viewer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.css">
  <style>
    :root {
      --bg-base: #090d16;
      --bg-surface: #0f172a;
      --bg-card: #1e293b;
      --bg-hover: #334155;
      --border-color: #334155;
      --primary: #06b6d4;
      --primary-hover: #0891b2;
      --accent: #3b82f6;
      --accent-emerald: #10b981;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --sidebar-width: 380px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-base);
      color: var(--text-main);
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    header.app-header {
      height: 64px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      z-index: 100;
      flex-shrink: 0;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-badge {
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      color: #000;
      font-weight: 800;
      font-size: 0.95rem;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 0.05em;
    }

    .brand-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .brand-subtitle {
      font-size: 0.8rem;
      color: var(--text-muted);
      border-left: 1px solid var(--border-color);
      padding-left: 12px;
      margin-left: 4px;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .faculty-toggle-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .faculty-toggle-btn:hover {
      background: rgba(16, 185, 129, 0.22);
      border-color: #34d399;
    }

    .faculty-toggle-btn.active {
      background: linear-gradient(135deg, #059669, #10b981);
      color: #fff;
      box-shadow: 0 0 16px rgba(16, 185, 129, 0.4);
    }

    .app-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    aside.sidebar {
      width: var(--sidebar-width);
      background: var(--bg-surface);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    .sidebar-search {
      padding: 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .search-input-wrapper {
      position: relative;
    }

    .search-input-wrapper input {
      width: 100%;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 10px 12px 10px 36px;
      color: var(--text-main);
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-input-wrapper input:focus {
      border-color: var(--primary);
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .sidebar-content::-webkit-scrollbar {
      width: 6px;
    }
    .sidebar-content::-webkit-scrollbar-thumb {
      background: var(--bg-hover);
      border-radius: 3px;
    }

    .category-group {
      margin-bottom: 16px;
    }

    .category-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      cursor: pointer;
      border-radius: 6px;
      user-select: none;
    }

    .category-header:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.03);
    }

    .category-badge {
      background: var(--bg-card);
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .file-item {
      display: flex;
      flex-direction: column;
      padding: 10px 12px;
      margin: 3px 0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
      border: 1px solid transparent;
      background: transparent;
    }

    .file-item:hover {
      background: var(--bg-card);
      border-color: rgba(255, 255, 255, 0.05);
    }

    .file-item.active {
      background: linear-gradient(90deg, rgba(6, 182, 212, 0.15), rgba(59, 130, 246, 0.08));
      border-color: rgba(6, 182, 212, 0.4);
    }

    .file-item-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }

    .file-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-main);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-item.active .file-name {
      color: var(--primary);
    }

    .file-path {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-top: 3px;
      font-family: 'Fira Code', monospace;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .faculty-badge {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      font-size: 0.68rem;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      white-space: nowrap;
    }

    main.code-viewer {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-base);
      overflow: hidden;
    }

    .code-viewer-header {
      padding: 16px 24px;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .code-title-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow: hidden;
    }

    .code-title {
      font-size: 1.15rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .lang-pill {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 6px;
      background: var(--bg-card);
      color: var(--primary);
      border: 1px solid var(--border-color);
      font-family: 'Fira Code', monospace;
    }

    .code-path {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-family: 'Fira Code', monospace;
      word-break: break-all;
    }

    .code-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: var(--bg-hover);
      border-color: var(--primary);
    }

    .evidence-panel {
      background: linear-gradient(90deg, rgba(6, 182, 212, 0.08), rgba(59, 130, 246, 0.04));
      border-bottom: 1px solid rgba(6, 182, 212, 0.2);
      padding: 12px 24px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      flex-shrink: 0;
    }

    .evidence-icon {
      font-size: 1.2rem;
      line-height: 1;
      margin-top: 2px;
    }

    .evidence-content {
      flex: 1;
    }

    .evidence-label {
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--primary);
      margin-bottom: 2px;
    }

    .evidence-text {
      font-size: 0.85rem;
      color: #cbd5e1;
      line-height: 1.45;
    }

    .code-container {
      flex: 1;
      overflow: auto;
      padding: 0;
      position: relative;
      background: #0b1120;
    }

    pre[class*="language-"] {
      margin: 0 !important;
      padding: 20px 24px !important;
      background: transparent !important;
      font-family: 'Fira Code', monospace !important;
      font-size: 0.875rem !important;
      line-height: 1.6 !important;
    }

    code[class*="language-"] {
      font-family: 'Fira Code', monospace !important;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-muted);
      text-align: center;
      gap: 12px;
    }

    .empty-icon {
      font-size: 2.5rem;
    }
  </style>
</head>
<body>

  <header class="app-header">
    <div class="brand-section">
      <div class="logo-badge">VAYRO</div>
      <div class="brand-title">Review 1 Code Viewer</div>
      <div class="brand-subtitle">Interactive Faculty Viva & Architecture Inspector</div>
    </div>
    <div class="header-controls">
      <button id="facultyModeBtn" class="faculty-toggle-btn">
        <span>🎓</span>
        <span>Faculty Demo Mode</span>
      </button>
    </div>
  </header>

  <div class="app-body">
    <aside class="sidebar">
      <div class="sidebar-search">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" id="fileSearch" placeholder="Search files by name, path, category...">
        </div>
      </div>
      <div class="sidebar-content" id="sidebarList"></div>
    </aside>

    <main class="code-viewer">
      <div class="code-viewer-header">
        <div class="code-title-group">
          <div class="code-title">
            <span id="viewFileName">Select a file</span>
            <span id="viewLangPill" class="lang-pill" style="display:none;">JAVA</span>
          </div>
          <div class="code-path" id="viewFilePath">No file selected</div>
        </div>
        <div class="code-actions">
          <button id="copyBtn" class="action-btn">
            <span>📋</span>
            <span id="copyBtnText">Copy Code</span>
          </button>
        </div>
      </div>

      <div class="evidence-panel" id="evidencePanel" style="display: none;">
        <div class="evidence-icon">💡</div>
        <div class="evidence-content">
          <div class="evidence-label">Why This File Matters for Review 1</div>
          <div class="evidence-text" id="evidenceText">Explanation text</div>
        </div>
      </div>

      <div class="code-container" id="codeContainer">
        <div class="empty-state" id="emptyState">
          <div class="empty-icon">📁</div>
          <h3>Select a source file from the sidebar</h3>
          <p>Browse through Project Architecture, Eureka, JWT, Gateway, Microservices, and Booking files.</p>
        </div>
        <pre class="line-numbers" id="preBlock" style="display:none;"><code id="codeBlock" class="language-java"></code></pre>
      </div>
    </main>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-java.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-yaml.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-jsx.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-markup.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.js"></script>

  <script>
    const DATA = """ + json_str + """;

    let facultyMode = false;
    let currentSelectedPath = null;
    let searchQuery = "";

    function renderSidebar() {
      const sidebar = document.getElementById("sidebarList");
      sidebar.innerHTML = "";

      DATA.forEach(cat => {
        let filteredFiles = cat.files.filter(f => {
          if (facultyMode && !f.facultyOrder) return false;
          if (!searchQuery) return true;
          const q = searchQuery.toLowerCase();
          return f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q) || cat.title.toLowerCase().includes(q);
        });

        if (facultyMode) {
          filteredFiles.sort((a, b) => (a.facultyOrder || 99) - (b.facultyOrder || 99));
        }

        if (filteredFiles.length === 0) return;

        const group = document.createElement("div");
        group.className = "category-group";

        const header = document.createElement("div");
        header.className = "category-header";
        header.innerHTML = `
          <span>${cat.icon} ${cat.title}</span>
          <span class="category-badge">${filteredFiles.length}</span>
        `;
        group.appendChild(header);

        filteredFiles.forEach(file => {
          const item = document.createElement("div");
          item.className = "file-item" + (file.path === currentSelectedPath ? " active" : "");
          item.innerHTML = `
            <div class="file-item-header">
              <span class="file-name">${file.name}</span>
              ${file.facultyOrder ? `<span class="faculty-badge">STEP ${file.facultyOrder}</span>` : ""}
            </div>
            <div class="file-path">${file.path}</div>
          `;
          item.onclick = () => selectFile(file);
          group.appendChild(item);
        });

        sidebar.appendChild(group);
      });
    }

    function selectFile(file) {
      currentSelectedPath = file.path;
      document.getElementById("viewFileName").innerText = file.name;
      document.getElementById("viewFilePath").innerText = file.path;

      const langPill = document.getElementById("viewLangPill");
      langPill.innerText = file.lang.toUpperCase();
      langPill.style.display = "inline-block";

      const evidence = document.getElementById("evidencePanel");
      const evidenceText = document.getElementById("evidenceText");
      if (file.importance) {
        evidenceText.innerText = file.importance;
        evidence.style.display = "flex";
      } else {
        evidence.style.display = "none";
      }

      const emptyState = document.getElementById("emptyState");
      const preBlock = document.getElementById("preBlock");
      const codeBlock = document.getElementById("codeBlock");

      emptyState.style.display = "none";
      preBlock.style.display = "block";

      let prismLang = "java";
      if (file.lang === "yaml" || file.path.endsWith(".yml") || file.path.endsWith(".yaml")) prismLang = "yaml";
      else if (file.lang === "xml" || file.path.endsWith(".xml")) prismLang = "markup";
      else if (file.lang === "javascript" || file.path.endsWith(".js") || file.path.endsWith(".jsx")) prismLang = "javascript";
      else if (file.lang === "markdown" || file.path.endsWith(".md")) prismLang = "markdown";

      codeBlock.className = `language-${prismLang}`;
      codeBlock.textContent = file.code;

      Prism.highlightElement(codeBlock);
      renderSidebar();
    }

    document.getElementById("copyBtn").onclick = () => {
      const codeBlock = document.getElementById("codeBlock");
      if (!codeBlock.textContent) return;
      navigator.clipboard.writeText(codeBlock.textContent).then(() => {
        const btnText = document.getElementById("copyBtnText");
        btnText.innerText = "Copied!";
        setTimeout(() => {
          btnText.innerText = "Copy Code";
        }, 2000);
      });
    };

    document.getElementById("fileSearch").oninput = (e) => {
      searchQuery = e.target.value.trim();
      renderSidebar();
    };

    document.getElementById("facultyModeBtn").onclick = () => {
      facultyMode = !facultyMode;
      const btn = document.getElementById("facultyModeBtn");
      if (facultyMode) {
        btn.classList.add("active");
        btn.innerHTML = `<span>🎓</span><span>Faculty Demo Mode: ON</span>`;
      } else {
        btn.classList.remove("active");
        btn.innerHTML = `<span>🎓</span><span>Faculty Demo Mode</span>`;
      }
      renderSidebar();
    };

    renderSidebar();
    const defaultFile = DATA[1]?.files[0];
    if (defaultFile) selectFile(defaultFile);
  </script>
</body>
</html>
"""

with open(out_path, "w", encoding="utf-8") as out:
    out.write(html_template)

print(f"SUCCESS: Generated Code Viewer at {out_path} with {file_counter} real project files.")
