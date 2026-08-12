# Military Asset Management System - Technical Documentation

---

## 1. Project Overview

### Description
The Military Asset Management System is an enterprise-grade web application designed to track and manage critical military assets (vehicles, weapons, ammunition) across multiple military bases. The system provides end-to-end asset visibility, operational accountability, granular security through Role-Based Access Control (RBAC), and comprehensive audit logging for compliance.

### Key Objectives
- **End-to-End Asset Visibility**: Real-time tracking of opening balances, net movements, assignments, expenditures, and closing balances
- **Operational Accountability**: Complete audit trail for cross-base asset transfers
- **Granular Security**: Three-tier RBAC ensuring appropriate data access (Admin, Base Commander, Logistics Officer)
- **Auditability**: Automatic logging of every mutation for compliance and investigation

### Assumptions
- Users have basic familiarity with military logistics operations
- PostgreSQL database will be hosted either locally or via cloud service (Render, Supabase, Neon)
- System will be deployed in a controlled environment with proper network security
- Demo credentials are for testing only and will be changed in production

### Limitations
- Currently supports single-tenant deployment (not multi-tenant)
- No real-time notifications for transfer status changes
- Limited to three predefined user roles (extensible but requires code changes)
- No integration with external military logistics systems
- Dashboard calculations are performed on-demand (not cached)
- No offline mode capability

---

## 2. Tech Stack & Architecture

### Backend Technology Stack

**Node.js (v18+)**
- **Justification**: Proven, scalable runtime with extensive ecosystem support. Event-driven architecture suitable for I/O-heavy operations like database queries.

**Express.js**
- **Justification**: Minimal, flexible web framework with robust middleware support. Large community and battle-tested in production environments.

**PostgreSQL**
- **Justification**: Relational database ensuring ACID compliance for transactional integrity. Critical for atomic transfers and financial-grade inventory tracking. Supports complex queries for dashboard calculations.

**Prisma ORM**
- **Justification**: Type-safe database toolkit with excellent TypeScript support. Simplifies schema management, migrations, and provides auto-generated type-safe client.

**JWT (JSON Web Tokens)**
- **Justification**: Stateless authentication mechanism. Scalable for distributed deployments and easy integration with frontend.

**bcryptjs**
- **Justification**: Industry-standard password hashing library. Provides secure password storage with configurable salt rounds.

**Helmet**
- **Justification**: Security middleware that sets various HTTP headers to protect against well-known web vulnerabilities.

**CORS**
- **Justification**: Enables controlled cross-origin resource sharing between frontend and backend.

### Frontend Technology Stack

**React **
- **Justification**: Component-based architecture with virtual DOM for efficient rendering. Large ecosystem and excellent developer experience.

**Vite**
- **Justification**: Fast build tool with hot module replacement. Significantly faster development experience compared to Create React App.

**React Router **
- **Justification**: Declarative routing for SPA navigation. Supports protected routes and nested routing.

**Tailwind CSS**
- **Justification**: Utility-first CSS framework enabling rapid UI development. Consistent design system without writing custom CSS.

**Axios**
- **Justification**: Promise-based HTTP client with interceptors for authentication. Better error handling than fetch API.

**Lucide React**
- **Justification**: Lightweight, consistent icon library. Tree-shakeable for optimal bundle size.

**Context API**
- **Justification**: Built-in React state management for authentication. Sufficient for this application's complexity without additional libraries.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Dashboard  │  │   Purchases  │  │   Transfers  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Assignments  │  │  Audit Logs  │  │    Login     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │ HTTP/HTTPS
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Backend (Express)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Middleware Layer                         │  │
│  │  • Helmet (Security)  • CORS  • Auth (JWT)          │  │
│  │  • RBAC Middleware  • Base Scope Enforcement        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Routes Layer                            │  │
│  │  /auth  /dashboard  /purchases  /transfers          │  │
│  │  /assignments  /expenditures  /bases  /equipment    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Controllers Layer                        │  │
│  │  Business logic for each endpoint                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Prisma ORM                               │  │
│  └──────────────────────────────────────────────────────┘  │
│  Tables: users, bases, equipment_types, assets,           │
│  purchases, transfers, assignments, expenditures,           │
│  audit_logs                                                │
└─────────────────────────────────────────────────────────────┘
```

### Security Architecture
- **Authentication**: JWT tokens with 24-hour expiration
- **Authorization**: RBAC middleware at route level
- **Data Scoping**: Base-level filtering enforced on backend
- **Password Security**: bcrypt hashing with 10 salt rounds
- **API Security**: Helmet headers, CORS configuration
- **Audit Trail**: All mutations logged with user context

---

## 3. Data Models / Schema

### Core Entities and Relationships

```
┌─────────────┐         ┌─────────────┐
│    User     │────────▶│    Base     │
│             │  (N:1)  │             │
│ - id        │         │ - id        │
│ - username  │         │ - name      │
│ - password  │         │ - location  │
│ - role      │         └─────────────┘
│ - baseId    │                │
└─────────────┘                │
                                │ (1:N)
                                ↓
┌─────────────┐         ┌─────────────┐
│EquipmentType│◀────────│  Purchase   │
│             │ (1:N)   │             │
│ - id        │         │ - id        │
│ - name      │         │ - baseId    │
│ - category  │         │ - equipId   │
└─────────────┘         │ - quantity  │
         │              │ - date      │
         │ (1:N)        └─────────────┘
         ↓
┌─────────────┐         ┌─────────────┐
│   Asset     │◀────────│  Transfer   │
│             │ (1:N)   │             │
│ - id        │         │ - id        │
│ - baseId    │         │ - sourceId  │
│ - equipId   │         │ - destId    │
│ - quantity  │         │ - equipId   │
│ - status    │         │ - quantity  │
└─────────────┘         │ - status    │
         │              └─────────────┘
         │ (1:N)                │
         ↓                      │
┌─────────────┐         ┌─────────────┐
│ Assignment  │         │ Expenditure │
│             │         │             │
│ - id        │         │ - id        │
│ - baseId    │         │ - baseId    │
│ - equipId   │         │ - equipId   │
│ - personnel │         │ - quantity  │
│ - quantity  │         │ - reason    │
│ - status    │         └─────────────┘
└─────────────┘
         │
         │ (1:N)
         ↓
┌─────────────┐
│  AuditLog   │
│             │
│ - id        │
│ - userId    │
│ - action    │
│ - details   │
│ - timestamp │
└─────────────┘
```

### Table Descriptions

**User**
- Stores system user accounts with authentication credentials
- Links to Base for command-level access control
- Role determines system permissions

**Base**
- Represents military bases/locations
- Central entity for asset tracking

**EquipmentType**
- Defines categories of equipment (WEAPON, VEHICLE, AMMUNITION, OTHER)
- Used across all transaction types for classification

**Asset**
- Current inventory snapshot at each base
- Supports both serialized assets (serialNumber) and quantity-based inventory
- Status tracking (AVAILABLE, ASSIGNED, MAINTENANCE, RETIRED)

**Purchase**
- Records asset acquisition from external sources
- Increases inventory at specified base
- Creates audit log entry

**Transfer**
- Tracks cross-base asset movements
- Atomic transaction ensuring source decrease and destination increase
- Status workflow: PENDING → IN_TRANSIT → COMPLETED/CANCELLED

**Assignment**
- Records asset allocation to personnel
- Decreases available inventory
- Supports return workflow (ACTIVE → RETURNED)

**Expenditure**
- Records consumed/expended assets (e.g., ammunition used in training)
- Decreases available inventory
- Requires reason for tracking purposes

**AuditLog**
- Comprehensive system activity log
- Records all mutations with user context
- Supports compliance and investigation

### Key Relationships
- User → Base: Optional (Admins have no base, others have one)
- Base → All transaction types: One-to-many
- EquipmentType → All transaction types: One-to-many
- User → AuditLog: One-to-many (who performed action)
- User → Transfer: One-to-many (who initiated transfer)

---

## 4. RBAC Explanation

### Role Definitions

**ADMIN**
- **Scope**: Global access to all bases and operations
- **Permissions**:
  - Full CRUD on all entities
  - View and manage audit logs
  - Create equipment types
  - Delete purchases
  - Override base restrictions
- **Use Case**: System administrators, logistics directors

**BASE_COMMANDER**
- **Scope**: Single assigned base only
- **Permissions**:
  - View dashboard for assigned base
  - Create and view purchases for assigned base
  - Initiate transfers from assigned base
  - Manage assignments and expenditures for assigned base
  - Cannot view other bases' data
  - Cannot access audit logs
- **Use Case**: Base commanders, facility managers

**LOGISTICS_OFFICER**
- **Scope**: Single assigned base (logistics operations only)
- **Permissions**:
  - View dashboard for assigned base
  - Create and view purchases for assigned base
  - Initiate transfers from assigned base
  - Cannot manage assignments or expenditures
  - Cannot access audit logs
- **Use Case**: Logistics coordinators, supply officers

### Enforcement Method

**Backend Enforcement (Primary)**
1. **Authentication Middleware** (`authenticateToken`)
   - Validates JWT token on every protected route
   - Attaches user info (userId, role, baseId) to request object
   - Rejects invalid/expired tokens with 403 status

2. **Role Authorization Middleware** (`authorizeRoles`)
   - Applied at route level
   - Checks if user's role is in allowed roles list
   - Example: `authorizeRoles('ADMIN', 'BASE_COMMANDER')`
   - Rejects unauthorized access with 403 status

3. **Base Scope Middleware** (`enforceBaseScope`)
   - Automatically injects baseId filter for non-admin users
   - Forces query to user's assigned base
   - Prevents manual baseId override in requests
   - Example: Base Commander cannot query `?baseId=2` if assigned to base 1

**Frontend Enforcement (UX Only)**
- Role-based navigation menu (hides inaccessible routes)
- Role-based form visibility (hides create buttons)
- **Important**: Frontend restrictions are for UX only; backend is the authority

### Authorization Matrix

| Feature | Admin | Base Commander | Logistics Officer |
|---------|-------|----------------|-------------------|
| Dashboard (All Bases) | ✅ | ❌ | ❌ |
| Dashboard (Own Base) | ✅ | ✅ | ✅ |
| Purchases (All Bases) | ✅ | ❌ | ❌ |
| Purchases (Own Base) | ✅ | ✅ | ✅ |
| Transfers (All Bases) | ✅ | ❌ | ❌ |
| Transfers (Own Base) | ✅ | ✅ | ✅ |
| Assignments | ✅ | ✅ | ❌ |
| Expenditures | ✅ | ✅ | ❌ |
| Audit Logs | ✅ | ❌ | ❌ |
| Equipment Types (Create) | ✅ | ❌ | ❌ |
| Purchases (Delete) | ✅ | ❌ | ❌ |

### Security Rules
1. **Never trust client-side role checks** - Always validate on backend
2. **Base scoping is mandatory** - Non-admins cannot bypass base restrictions
3. **Audit all authorization failures** - Log 403 errors for security monitoring
4. **JWT expiration** - Tokens expire after 24 hours, requiring re-authentication
5. **Password security** - All passwords hashed with bcrypt (10 rounds)

---

## 5. API Logging

### Implementation Approach

**Audit Log Service**
- Centralized logging service integrated into all mutation controllers
- Automatically creates log entries for:
  - PURCHASE operations
  - TRANSFER operations (created, completed, status updates)
  - ASSIGNMENT operations (created, returned)
  - EXPENDITURE operations
  - DELETE operations
  - LOGIN operations

**Log Entry Structure**
```javascript
{
  id: Int,
  userId: Int,              // Who performed the action
  action: String,           // Action type (PURCHASE, TRANSFER, etc.)
  entityType: String,       // Entity affected (Purchase, Transfer, etc.)
  entityId: Int,            // ID of affected entity
  details: String,          // Human-readable description
  ipAddress: String?,       // Optional IP address
  createdAt: DateTime       // Timestamp
}
```

**Logging Points**

1. **Purchase Creation**
   - Trigger: POST /api/purchases
   - Details: "Created purchase of X [Equipment] at [Base]"
   - Context: User ID, base, equipment type, quantity

2. **Transfer Operations**
   - Trigger: POST /api/transfers, PATCH /api/transfers/:id/status
   - Details: "Transferred X [Equipment] from [Source] to [Destination]"
   - Context: User ID, source base, destination base, equipment type, quantity

3. **Assignment Operations**
   - Trigger: POST /api/assignments, PATCH /api/assignments/:id/return
   - Details: "Assigned X [Equipment] to [Personnel] at [Base]"
   - Context: User ID, personnel name, base, equipment type, quantity

4. **Expenditure Recording**
   - Trigger: POST /api/expenditures
   - Details: "Recorded expenditure of X [Equipment] for: [Reason]"
   - Context: User ID, reason, base, equipment type, quantity

5. **Login Events**
   - Trigger: POST /api/auth/login
   - Details: "[Username] logged in"
   - Context: User ID, username, role

6. **Delete Operations**
   - Trigger: DELETE /api/purchases/:id
   - Details: "Deleted purchase [ID]"
   - Context: User ID, entity ID

**Transaction Safety**
- Audit logs are created within database transactions
- If the main operation fails, the audit log is rolled back
- Ensures audit trail consistency with data state

**Access Control**
- Audit logs are protected by ADMIN-only access
- Only admins can view the complete audit trail
- Non-admin users cannot access audit endpoints

**Query Capabilities**
- Filter by user ID
- Filter by action type
- Filter by date range
- Pagination support (last 100 entries by default)
- Includes user context (username, role) in results

**Compliance Benefits**
- Complete audit trail for regulatory compliance
- Investigation support for discrepancies
- Accountability tracking for all asset movements
- Security monitoring (failed login attempts, unauthorized access)

---

## 6. Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- PostgreSQL (v12 or higher) OR Docker
- Git
- Modern web browser

### Option 1: Docker Setup (Recommended)

#### Step 1: Clone Repository
```bash
git clone <repository-url>
cd military-asset-management
```

#### Step 2: Start PostgreSQL with Docker
```bash
docker-compose up -d
```
This starts PostgreSQL on port 5432 with:
- Database: military_asset_db
- User: postgres
- Password: password

#### Step 3: Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env



# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed database with sample data
npm run seed

# Start backend server
npm run dev
```
Backend will run on http://localhost:5000

#### Step 4: Frontend Setup (New Terminal)
```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env (default values work)
# VITE_API_BASE_URL=http://localhost:5000/api

# Start frontend dev server
npm run dev
```
Frontend will run on http://localhost:3000

#### Step 5: Access Application
- Open browser to http://localhost:3000
- Login with demo credentials (see Section 8)

### Option 2: Local PostgreSQL Setup

#### Step 1: Install PostgreSQL
- Windows: Download from postgresql.org
- macOS: `brew install postgresql`
- Linux: `sudo apt-get install postgresql`

#### Step 2: Start PostgreSQL Service
```bash
# Windows
Start PostgreSQL service from Services

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

#### Step 3: Create Database
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE military_asset_db;

# Exit
\q
```


# Server Configuration
PORT=5000
NODE_ENV=development
```

**Frontend (.env)**
```bash
# API Base URL
VITE_API_BASE_URL=http://localhost:5000/api
```

### Verification Steps

1. **Check Database Connection**
```bash
cd backend
npx prisma studio
```
Opens Prisma Studio at http://localhost:5555 to view data

2. **Check Backend Health**
```bash
curl http://localhost:5000/api/health
```
Should return: `{"status":"ok","timestamp":"..."}`

3. **Test Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_user","password":"AdminPass123!"}'
```

### Troubleshooting

**Database Connection Failed**
- Verify PostgreSQL is running: `docker ps` or check services
- Check DATABASE_URL in .env
- Ensure database exists: `psql -U postgres -l`

**Prisma Migration Errors**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Re-run migrations
npx prisma migrate dev --name init
```

**Frontend API Connection Issues**
- Verify backend is running on port 5000
- Check VITE_API_BASE_URL in frontend .env
- Ensure CORS is configured in backend
- Check browser console for CORS errors

**Seed Data Issues**
```bash
# Re-run seed
cd backend
npm run seed
```

---

## 7. API Endpoints

### Authentication Endpoints

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "admin_user",
  "password": "AdminPass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin_user",
    "role": "ADMIN",
    "baseId": null,
    "baseName": null
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

#### GET /api/auth/me
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin_user",
    "role": "ADMIN",
    "baseId": null,
    "base": {
      "id": null,
      "name": null,
      "location": null
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Dashboard Endpoints

#### GET /api/dashboard/metrics
Get inventory metrics with optional filters.

**Query Parameters:**
- `baseId` (optional): Filter by base ID
- `equipmentTypeId` (optional): Filter by equipment type ID
- `startDate` (optional): Filter by start date (ISO format)
- `endDate` (optional): Filter by end date (ISO format)

**Example:**
```
GET /api/dashboard/metrics?baseId=1&equipmentTypeId=4&startDate=2024-01-01&endDate=2024-12-31
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "openingBalance": 1000,
    "purchases": 500,
    "transfersIn": 200,
    "transfersOut": 100,
    "netMovement": 600,
    "assigned": 150,
    "expended": 50,
    "closingBalance": 1400
  }
}
```

### Purchase Endpoints

#### GET /api/purchases
List purchases with optional filters.

**Query Parameters:**
- `baseId` (optional): Filter by base ID
- `equipmentTypeId` (optional): Filter by equipment type ID
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "baseId": 1,
      "base": { "id": 1, "name": "Fort Alpha" },
      "equipmentTypeId": 4,
      "equipmentType": {
        "id": 4,
        "name": "5.56mm Ammunition",
        "category": "AMMUNITION"
      },
      "quantity": 2000,
      "purchaseDate": "2024-01-15T00:00:00.000Z",
      "referenceNumber": "PO-2024-001",
      "createdBy": 1,
      "createdAt": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/purchases
Create a new purchase record.

**Request Body:**
```json
{
  "baseId": 1,
  "equipmentTypeId": 4,
  "quantity": 500,
  "purchaseDate": "2024-01-20",
  "referenceNumber": "PO-2024-005"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "baseId": 1,
    "equipmentTypeId": 4,
    "quantity": 500,
    "purchaseDate": "2024-01-20T00:00:00.000Z",
    "referenceNumber": "PO-2024-005",
    "createdBy": 1,
    "createdAt": "2024-01-20T00:00:00.000Z"
  }
}
```

#### DELETE /api/purchases/:id
Delete a purchase record (Admin only).

**Response (200):**
```json
{
  "success": true,
  "message": "Purchase deleted"
}
```

### Transfer Endpoints

#### GET /api/transfers
List transfers with optional filters.

**Query Parameters:**
- `baseId` (optional): Filter by base (source or destination)
- `status` (optional): Filter by status (PENDING, IN_TRANSIT, COMPLETED, CANCELLED)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sourceBaseId": 1,
      "sourceBase": { "id": 1, "name": "Fort Alpha" },
      "destinationBaseId": 2,
      "destinationBase": { "id": 2, "name": "Fort Bravo" },
      "equipmentTypeId": 4,
      "equipmentType": {
        "id": 4,
        "name": "5.56mm Ammunition",
        "category": "AMMUNITION"
      },
      "quantity": 500,
      "status": "COMPLETED",
      "timestamp": "2024-01-10T10:00:00.000Z",
      "initiatedBy": 1,
      "initiator": { "id": 1, "username": "admin_user" },
      "createdAt": "2024-01-10T10:00:00.000Z"
    }
  ]
}
```

#### POST /api/transfers
Initiate a new transfer (atomic transaction).

**Request Body:**
```json
{
  "sourceBaseId": 1,
  "destinationBaseId": 2,
  "equipmentTypeId": 4,
  "quantity": 100
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Transfer completed successfully"
}
```

**Error (400):**
```json
{
  "success": false,
  "message": "Insufficient inventory at source base"
}
```

#### PATCH /api/transfers/:id/status
Update transfer status.

**Request Body:**
```json
{
  "status": "COMPLETED"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "COMPLETED",
    ...
  }
}
```

### Assignment Endpoints

#### GET /api/assignments
List assignments with optional filters.

**Query Parameters:**
- `baseId` (optional): Filter by base ID
- `equipmentTypeId` (optional): Filter by equipment type ID
- `status` (optional): Filter by status (ACTIVE, RETURNED)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "baseId": 1,
      "base": { "id": 1, "name": "Fort Alpha" },
      "equipmentTypeId": 1,
      "equipmentType": {
        "id": 1,
        "name": "M4 Carbine",
        "category": "WEAPON"
      },
      "personnelName": "Sgt. John Smith",
      "quantity": 2,
      "assignedAt": "2024-01-05T00:00:00.000Z",
      "assignedBy": 2,
      "status": "ACTIVE",
      "createdAt": "2024-01-05T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/assignments
Create a new assignment.

**Request Body:**
```json
{
  "baseId": 1,
  "equipmentTypeId": 1,
  "personnelName": "Cpl. Jane Doe",
  "quantity": 1
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "baseId": 1,
    "equipmentTypeId": 1,
    "personnelName": "Cpl. Jane Doe",
    "quantity": 1,
    "assignedAt": "2024-01-20T00:00:00.000Z",
    "assignedBy": 2,
    "status": "ACTIVE",
    "createdAt": "2024-01-20T00:00:00.000Z"
  }
}
```

#### PATCH /api/assignments/:id/return
Return an assignment (restores inventory).

**Response (200):**
```json
{
  "success": true,
  "message": "Assignment returned successfully"
}
```

### Expenditure Endpoints

#### GET /api/expenditures
List expenditures with optional filters.

**Query Parameters:**
- `baseId` (optional): Filter by base ID
- `equipmentTypeId` (optional): Filter by equipment type ID
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "baseId": 1,
      "base": { "id": 1, "name": "Fort Alpha" },
      "equipmentTypeId": 4,
      "equipmentType": {
        "id": 4,
        "name": "5.56mm Ammunition",
        "category": "AMMUNITION"
      },
      "quantity": 500,
      "reason": "Training exercise",
      "expendedAt": "2024-01-08T00:00:00.000Z",
      "recordedBy": 3,
      "createdAt": "2024-01-08T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/expenditures
Record a new expenditure.

**Request Body:**
```json
{
  "baseId": 1,
  "equipmentTypeId": 4,
  "quantity": 100,
  "reason": "Field operation"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "baseId": 1,
    "equipmentTypeId": 4,
    "quantity": 100,
    "reason": "Field operation",
    "expendedAt": "2024-01-20T00:00:00.000Z",
    "recordedBy": 3,
    "createdAt": "2024-01-20T00:00:00.000Z"
  }
}
```

### Base Endpoints

#### GET /api/bases
List all bases.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Fort Alpha",
      "location": "Northern Sector",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Fort Bravo",
      "location": "Eastern Sector",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Equipment Type Endpoints

#### GET /api/equipment-types
List all equipment types.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "M4 Carbine",
      "category": "WEAPON",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 4,
      "name": "5.56mm Ammunition",
      "category": "AMMUNITION",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/equipment-types
Create a new equipment type (Admin only).

**Request Body:**
```json
{
  "name": "M16 Rifle",
  "category": "WEAPON"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "name": "M16 Rifle",
    "category": "WEAPON",
    "createdAt": "2024-01-20T00:00:00.000Z",
    "updatedAt": "2024-01-20T00:00:00.000Z"
  }
}
```

### Audit Log Endpoints

#### GET /api/audit-logs
List audit logs with optional filters (Admin only).

**Query Parameters:**
- `userId` (optional): Filter by user ID
- `action` (optional): Filter by action type
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 1,
      "user": {
        "id": 1,
        "username": "admin_user",
        "role": "ADMIN"
      },
      "action": "PURCHASE",
      "entityType": "Purchase",
      "entityId": 1,
      "details": "Created purchase of 2000 5.56mm Ammunition at Fort Alpha",
      "ipAddress": null,
      "createdAt": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

### Error Response Format

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Human readable error message",
  "error": "ERROR_CODE" // Only in development
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., insufficient inventory)
- `500` - Internal Server Error

---

## 8. Login Credentials

### Demo Accounts

⚠️ **IMPORTANT**: These credentials are for demonstration and testing purposes only. They must be changed before deploying to production.

| Role | Username | Password | Base Assignment | Access Level |
|------|----------|----------|----------------|--------------|
| **Admin** | admin_user | AdminPass123! | None (Global) | Full access to all bases and operations |
| **Base Commander** | commander_alpha | CommandPass123! | Fort Alpha (Base #1) | Access to Fort Alpha data only |
| **Logistics Officer** | logistics_officer | LogisticsPass123! | Fort Alpha (Base #1) | Purchases and transfers for Fort Alpha only |

### Role Capabilities Summary

**Admin (admin_user)**
- ✅ View dashboard for all bases
- ✅ Create purchases for any base
- ✅ Initiate transfers between any bases
- ✅ Manage assignments and expenditures
- ✅ View audit logs
- ✅ Create equipment types
- ✅ Delete purchases

**Base Commander (commander_alpha)**
- ✅ View dashboard for Fort Alpha only
- ✅ Create purchases for Fort Alpha only
- ✅ Initiate transfers from Fort Alpha
- ✅ Manage assignments and expenditures for Fort Alpha
- ❌ Cannot view other bases' data
- ❌ Cannot access audit logs
- ❌ Cannot create equipment types
- ❌ Cannot delete purchases

**Logistics Officer (logistics_officer)**
- ✅ View dashboard for Fort Alpha only
- ✅ Create purchases for Fort Alpha only
- ✅ Initiate transfers from Fort Alpha
- ❌ Cannot manage assignments or expenditures
- ❌ Cannot view other bases' data
- ❌ Cannot access audit logs

### Security Notes

1. **Password Strength**: Demo passwords meet minimum complexity requirements but should be replaced with strong, unique passwords in production.

2. **JWT Secret**: The default JWT_SECRET in .env.example must be changed to a cryptographically secure random string in production.

3. **First Action**: After first login, Admin should:
   - Change all demo passwords
   - Update JWT_SECRET
   - Review and adjust user roles as needed
   - Remove or disable demo accounts if not needed

4. **Production Deployment**: Never commit .env files with real credentials to version control. Use environment variable management provided by your hosting platform.

### Testing Scenarios

**Test RBAC Enforcement:**
1. Login as `commander_alpha`
2. Attempt to access `/audit-logs` → Should be denied (403)
3. Attempt to create purchase for Fort Bravo → Should be denied (403)
4. Create purchase for Fort Alpha → Should succeed

**Test Base Scoping:**
1. Login as `commander_alpha`
2. Call `GET /api/purchases?baseId=2` → Should return Fort Alpha data only (baseId=1 forced)
3. Dashboard should show Fort Alpha metrics only

**Test Transfer Atomicity:**
1. Login as `admin_user`
2. Attempt transfer with quantity > available inventory → Should fail with error
3. Successful transfer should decrease source and increase destination atomically

**Test Audit Logging:**
1. Login as `admin_user`
2. Perform any mutation (purchase, transfer, assignment)
3. Check `/api/audit-logs` → Should show new entry with details

---

## Appendix A: Inventory Calculation Formulas

### Net Movement
```
Net Movement = Purchases + Transfers In - Transfers Out
```

### Closing Balance
```
Closing Balance = Opening Balance + Net Movement - Assigned - Expended
```

### Opening Balance (Period-based)
```
Opening Balance = Current Inventory
  - Purchases before period start
  + Transfers In before period start
  - Transfers Out before period start
  + Returned Assignments before period start
  - Active Assignments before period start
  - Expenditures before period start
```

---

## Appendix B: Database Schema (SQL)

```sql
-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) CHECK (role IN ('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')),
    base_id INT REFERENCES bases(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bases Table
CREATE TABLE bases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment Types Table
CREATE TABLE equipment_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) CHECK (category IN ('WEAPON', 'VEHICLE', 'AMMUNITION', 'OTHER')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assets Table
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    equipment_type_id INT REFERENCES equipment_types(id),
    base_id INT REFERENCES bases(id),
    serial_number VARCHAR(100),
    quantity INT DEFAULT 1,
    status VARCHAR(20) CHECK (status IN ('AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED')) DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchases Table
CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    base_id INT REFERENCES bases(id),
    equipment_type_id INT REFERENCES equipment_types(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    purchase_date TIMESTAMP NOT NULL,
    reference_number VARCHAR(100),
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transfers Table
CREATE TABLE transfers (
    id SERIAL PRIMARY KEY,
    source_base_id INT REFERENCES bases(id),
    destination_base_id INT REFERENCES bases(id),
    equipment_type_id INT REFERENCES equipment_types(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    status VARCHAR(20) CHECK (status IN ('PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')) DEFAULT 'PENDING',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    initiated_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assignments Table
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    base_id INT REFERENCES bases(id),
    equipment_type_id INT REFERENCES equipment_types(id),
    asset_id INT REFERENCES assets(id),
    personnel_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT REFERENCES users(id),
    status VARCHAR(20) CHECK (status IN ('ACTIVE', 'RETURNED')) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenditures Table
CREATE TABLE expenditures (
    id SERIAL PRIMARY KEY,
    base_id INT REFERENCES bases(id),
    equipment_type_id INT REFERENCES equipment_types(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    reason TEXT NOT NULL,
    expended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    details TEXT NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Appendix C: Deployment Guide

### Backend Deployment (Render/Railway)

1. **Push Code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Create PostgreSQL Database**
   - In Render/Railway dashboard, create new PostgreSQL instance
   - Note the database connection string

3. **Deploy Backend**
   - Connect repository to Render/Railway
   - Set environment variables:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `JWT_SECRET`: Generate a secure random string
     - `PORT`: 5000 (or platform-assigned port)
     - `NODE_ENV`: production

4. **Run Migrations**
   - Add deploy command: `npx prisma migrate deploy`
   - Or run manually after deployment

5. **Seed Database** (Optional)
   - Run: `npm run seed`
   - Or disable seed in production

### Frontend Deployment (Vercel/Netlify)

1. **Push Code to GitHub** (if not already done)

2. **Deploy to Vercel**
   - Connect repository to Vercel
   - Set environment variable:
     - `VITE_API_BASE_URL`: Your deployed backend URL (e.g., https://your-backend.onrender.com/api)
   - Deploy

3. **Deploy to Netlify**
   - Connect repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Set environment variable: `VITE_API_BASE_URL`
   - Deploy

### Production Checklist

- [ ] Change all demo passwords
- [ ] Update JWT_SECRET to secure random string
- [ ] Enable HTTPS (automatic on most platforms)
- [ ] Configure CORS to allow only frontend domain
- [ ] Set NODE_ENV=production
- [ ] Remove or disable seed script
- [ ] Configure database backups
- [ ] Set up monitoring and alerting
- [ ] Review and adjust RBAC roles
- [ ] Test all critical workflows
- [ ] Configure rate limiting (optional)
- [ ] Set up log aggregation (optional)

---

**Document Version**: 1.0  
**Last Updated**: August 2026  
**Author**: Ayush Raj
