# Military Asset Management System

An enterprise-grade web application for tracking and managing military assets (vehicles, weapons, ammunition) across multiple military bases with role-based access control and comprehensive audit logging.

## Features

- **Dashboard**: Real-time inventory metrics with opening balance, net movement, closing balance, assigned, and expended assets
- **Purchases Management**: Record and track asset purchases with historical data
- **Transfer Management**: Facilitate atomic asset transfers between bases with complete audit trail
- **Assignments & Expenditures**: Track personnel assignments and asset consumption
- **Role-Based Access Control (RBAC)**: Three-tier security (Admin, Base Commander, Logistics Officer)
- **Audit Logging**: Complete transaction history for compliance and accountability
- **Filtering**: Advanced filtering by date, base, and equipment type
- **Responsive Design**: Mobile-friendly interface for field operations

## Live URL:  https://military-asset-management-ruby.vercel.app

## Technology Stack

### Backend
- **Node.js** (v18+) - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Relational database (ACID compliance)
- **Prisma ORM** - Database toolkit and ORM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** (v18) - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **Context API** - State management

## Project Structure

```
military-asset-management/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.js            # Seed data
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js    # Database connection
│   │   ├── controllers/       # Business logic
│   │   ├── middleware/        # Auth & RBAC
│   │   ├── routes/           # API endpoints
│   │   └── server.js         # Express app
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── layouts/          # Layout components
│   │   ├── context/          # Auth context
│   │   ├── services/         # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

## Database Schema

### Core Entities

- **User**: System users with roles and base assignments
- **Base**: Military bases/locations
- **EquipmentType**: Categories of equipment (weapons, vehicles, ammunition)
- **Asset**: Current inventory at each base
- **Purchase**: Asset acquisition records
- **Transfer**: Cross-base asset movements
- **Assignment**: Personnel asset assignments
- **Expenditure**: Consumed/expended assets
- **AuditLog**: System activity logs

### Relationships

- Users belong to bases (optional for Admin)
- Bases have multiple assets, purchases, transfers, assignments, expenditures
- Equipment types are used across all transaction types
- All mutations create audit log entries

## Setup Instructions

### Prerequisites

- Node.js 
- npm or pnpm
- PostgreSQL (or use Docker)
- Git

### Option 1: Using Docker 

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd military-asset-management
   ```

2. **Start PostgreSQL with Docker**
   ```bash
   docker-compose up -d
   ```

3. **Backend Setup**
   ```bash
   cd backend
   npm install
  
   # Edit .env with your configuration
   npx prisma generate
   npx prisma migrate dev --name init
   npm run seed
   npm run dev
   ```

4. **Frontend Setup** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Option 2: Local PostgreSQL

1. **Install and start PostgreSQL locally**

2. **Create database**
   ```sql
   CREATE DATABASE military_asset_db;
   ```


4. **Follow steps 3-4 from Option 1**

## Environment Variables

### Backend (.env)
```
DATABASE_URL=""
JWT_SECRET=""
PORT=5000
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Dashboard
- `GET /api/dashboard/metrics` - Get inventory metrics

### Purchases
- `GET /api/purchases` - List purchases
- `POST /api/purchases` - Create purchase
- `DELETE /api/purchases/:id` - Delete purchase (Admin only)

### Transfers
- `GET /api/transfers` - List transfers
- `POST /api/transfers` - Create transfer
- `PATCH /api/transfers/:id/status` - Update transfer status

### Assignments
- `GET /api/assignments` - List assignments
- `POST /api/assignments` - Create assignment
- `PATCH /api/assignments/:id/return` - Return assignment

### Expenditures
- `GET /api/expenditures` - List expenditures
- `POST /api/expenditures` - Create expenditure

### Bases
- `GET /api/bases` - List all bases

### Equipment Types
- `GET /api/equipment-types` - List equipment types
- `POST /api/equipment-types` - Create equipment type (Admin only)

### Audit Logs
- `GET /api/audit-logs` - List audit logs (Admin only)

## Role-Based Access Control (RBAC)

### Admin
- Full access to all bases and operations
- Can view audit logs
- Can create equipment types
- Can delete purchases

### Base Commander
- Access only to their assigned base
- Can manage purchases, transfers, assignments, and expenditures
- Cannot view other bases' data
- Cannot access audit logs

### Logistics Officer
- Primarily manages purchases and transfers
- Limited to assigned base operations
- Cannot manage assignments or expenditures
- Cannot access audit logs

**Important**: RBAC is enforced on the backend. Frontend menu hiding is for UX only.

## Demo Credentials

⚠️ **These are demo credentials only. Do not use in production.**

| Role | Username | Password | Base |
|------|----------|----------|------|
| Admin | admin_user | AdminPass123! | All Bases (Global) |
| Base Commander | commander_alpha | CommandPass123! | Fort Alpha |
| Logistics Officer | logistics_officer | LogisticsPass123! | Fort Alpha |

## Inventory Calculations

The system uses the following formulas:

**Net Movement** = Purchases + Transfers In - Transfers Out

**Closing Balance** = Opening Balance + Net Movement - Assigned - Expended

All calculations are performed dynamically from transaction data to ensure accuracy.

## Security Features

- JWT-based authentication with 24-hour expiration
- bcrypt password hashing (10 rounds)
- Helmet security headers
- CORS configuration
- SQL injection prevention via Prisma ORM
- Parameterized queries
- Environment variable protection
- RBAC middleware enforcement
- Base-level data scoping
- Comprehensive audit logging

## Audit Logging

Every mutation operation creates an audit log entry:
- User ID and role
- Action type (PURCHASE, TRANSFER, ASSIGNMENT, EXPENDITURE, etc.)
- Entity type and ID
- Detailed description
- Timestamp

Admins can view all audit logs for compliance and investigation.

## Development

### Running Tests
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Building for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## Deployment

### Backend Deployment (Render/Railway)
1. Push code to GitHub
2. Connect repository to Render/Railway
3. Set environment variables
4. Deploy PostgreSQL add-on
5. Run migrations: `npx prisma migrate deploy`
6. Run seed: `npm run seed`

### Frontend Deployment (Vercel/Netlify)
1. Push code to GitHub
2. Connect repository to Vercel/Netlify
3. Set `VITE_API_BASE_URL` environment variable
4. Deploy

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists

### Prisma Migration Issues
```bash
npx prisma migrate reset
npx prisma migrate dev
```

### Frontend API Connection
- Verify backend is running on port 5000
- Check VITE_API_BASE_URL in frontend .env
- Ensure CORS is configured correctly

## License

ISC

## Support

For issues and questions, please open an issue in the repository.

## Author 
Ayush Raj
