# 🏢 Rusunawa Admin System

A comprehensive room rental management system built with React and Chakra UI. This admin interface provides complete control over tenant management, room bookings, payments, documents, and system operations.

## 🎯 Features

### 🔐 Authentication & Security
- JWT-based authentication with role management
- Protected routes and permission-based access
- Password reset and account management
- Session management and auto-logout

### 📊 Dashboard & Analytics
- Real-time system metrics and KPIs
- Interactive charts and data visualization
- Occupancy analytics and revenue tracking
- Tenant demographics and booking trends
- Customizable date ranges and filters

### 👥 Tenant Management
- Complete tenant lifecycle management
- Registration progress tracking with stepper
- Document verification workflow
- Waiting list management
- Bulk operations and data export

### 🏠 Room Management
- Room CRUD operations with photo upload
- Amenity management and facility tracking
- Availability calendar and scheduling
- Occupancy tracking and history
- Room classification and pricing

### 📅 Booking Management
- End-to-end booking workflow
- Approval system with notifications
- Status tracking and progress indicators
- Payment integration and verification
- Booking calendar and scheduling

### 💰 Payment Management
- Payment verification and approval
- Invoice generation and management
- Payment reminders and notifications
- Financial reporting and analytics
- Manual payment adjustments

### 📄 Document Management
- Document upload and verification
- Preview with zoom and rotation
- Bulk approval operations
- Document type management
- Audit trail and version control

### 🎫 Issue Management
- Ticket system with categorization
- Priority management and assignment
- Resolution tracking and workflows
- Comment system and collaboration
- Maintenance coordination

### ⚙️ System Settings
- User profile and preferences
- Email notification settings
- System configuration
- Security settings with 2FA
- Backup and maintenance tools

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Modern web browser

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd web

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API endpoints

# Start development server
npm start
```

### Environment Variables

```env
REACT_APP_API_BASE_URL=http://localhost:8000/api
REACT_APP_APP_NAME=Rusunawa Admin
REACT_APP_VERSION=1.0.0
```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components
│   └── modals/         # Modal components
├── context/            # React Context providers
├── pages/              # Page components
│   ├── auth/          # Authentication pages
│   ├── dashboard/     # Dashboard and analytics
│   ├── tenants/       # Tenant management
│   ├── rooms/         # Room management
│   ├── bookings/      # Booking management
│   ├── payments/      # Payment management
│   ├── documents/     # Document management
│   ├── issues/        # Issue management
│   ├── settings/      # System settings
│   └── system/        # System testing
├── services/          # API service layer
├── utils/             # Utility functions
└── hooks/             # Custom React hooks
```

## 🛠️ Available Scripts

```bash
# Development
npm start              # Start development server
npm run dev           # Alias for start

# Building
npm run build         # Build for production
npm run build:analyze # Build and analyze bundle
npm run preview       # Build and serve locally

# Testing
npm test              # Run tests
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint          # Check code quality
npm run lint:fix      # Fix linting issues
npm run format        # Format code with Prettier

# Deployment
npm run serve         # Serve production build
```

## 🧪 Testing

### System Test Page
Access the built-in system test at `/admin/system-test` to verify:
- Service layer functionality
- Component availability
- API connectivity
- System health

### Manual Testing
Follow the comprehensive testing checklist in `DEPLOYMENT_GUIDE.md`

### Automated Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

## 📦 Built With

### Core Technologies
- **React 18** - Modern React with concurrent features
- **Chakra UI** - Modular and accessible component library
- **React Router** - Declarative routing
- **Axios** - Promise-based HTTP client

### Additional Libraries
- **Chart.js & Recharts** - Data visualization
- **Date-fns** - Date utility library
- **React Icons** - Icon library
- **Formik & Yup** - Form handling and validation

## 🌐 API Integration

The system integrates with a Go backend through RESTful APIs:

```javascript
// Example service usage
import tenantService from './services/tenantService';

// Get all tenants
const tenants = await tenantService.getTenants();

// Create new tenant
const newTenant = await tenantService.createTenant(tenantData);
```

### Service Architecture
- **Authentication Service** - Login, logout, token management
- **Analytics Service** - Dashboard metrics and reporting
- **Tenant Service** - Tenant CRUD and management
- **Room Service** - Room and amenity management
- **Booking Service** - Booking workflow and approval
- **Payment Service** - Payment processing and verification
- **Document Service** - File upload and management
- **Issue Service** - Ticket and issue tracking
- **Settings Service** - System configuration
- **Notification Service** - Real-time notifications

## 🔧 Configuration

### Theme Configuration
Customize the theme in `src/theme/index.js`:

```javascript
const theme = extendTheme({
  colors: {
    brand: {
      50: '#e3f2fd',
      500: '#2196f3',
      900: '#0d47a1',
    }
  }
});
```

### API Configuration
Configure API settings in `src/config/apiConfig.js`:

```javascript
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
export const API_TIMEOUT = 30000;
```

## 📱 Responsive Design

The application is fully responsive and supports:
- **Desktop** (1920px+)
- **Laptop** (1024px-1919px)
- **Tablet** (768px-1023px)
- **Mobile** (320px-767px)

## 🔐 Security Features

- JWT token authentication
- Role-based access control
- XSS protection
- CSRF prevention
- Secure API communication
- Input validation and sanitization

## 🚀 Deployment

### Production Build
```bash
# Build optimized production bundle
npm run build

# Serve static files
npm run serve
```

### Environment Setup
1. Configure environment variables
2. Set up reverse proxy (nginx/Apache)
3. Configure SSL certificates
4. Set up monitoring and logging

See `DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

## 📊 Performance

### Optimization Features
- Code splitting by route
- Lazy loading of components
- Optimized bundle size
- Efficient re-rendering
- Memoized components

### Monitoring
- Performance metrics
- Error tracking
- User analytics
- System health monitoring

## 🐛 Troubleshooting

### Common Issues

**API Connection Issues**
- Verify `REACT_APP_API_BASE_URL` is correct
- Check CORS configuration on backend
- Ensure backend server is running

**Authentication Problems**
- Clear browser localStorage
- Check JWT token format
- Verify token expiration

**Build Issues**
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify environment variables

### Debug Tools
- React Developer Tools
- Browser Network tab
- System test page (`/admin/system-test`)
- Console logging

## 📋 Feature Checklist

- [x] 🔐 Complete authentication system
- [x] 📊 Real-time dashboard and analytics
- [x] 👥 Comprehensive tenant management
- [x] 🏠 Full room management system
- [x] 📅 End-to-end booking workflow
- [x] 💰 Payment processing and verification
- [x] 📄 Document management system
- [x] 🎫 Issue tracking and resolution
- [x] ⚙️ System settings and configuration
- [x] 📱 Responsive design
- [x] 🧪 Testing infrastructure
- [x] 📚 Comprehensive documentation

## 📞 Support

For support and maintenance:
1. Check the deployment guide
2. Use the system test page
3. Review browser console logs
4. Check API connectivity
5. Verify environment configuration

## 📄 License

This project is proprietary software developed for Rusunawa room rental management.

## 🏆 Status

**✅ COMPLETE** - All features implemented and production-ready

---

**Built with ❤️ for efficient room rental management**
