# BuyIndiaX Admin Access

## Admin Login Credentials

**CONFIDENTIAL - FOR AUTHORIZED PERSONNEL ONLY**

### Admin Dashboard Access
- **URL:** http://localhost:3000/admin
- **Email:** sumant@gmail.com
- **Password:** @Sumant3086

### Admin Capabilities

The admin user has exclusive access to:

1. **Dashboard Overview**
   - Total orders, users, products statistics
   - Revenue tracking
   - Recent orders monitoring
   - Orders by status breakdown

2. **Order Management**
   - View all customer orders
   - Update order status (Pending → Processing → Shipped → Delivered)
   - Track customer information
   - Pagination for large order lists

3. **Security Features**
   - Only one admin account exists
   - Admin role cannot be created through registration
   - Protected routes require admin authentication
   - Secure JWT-based authentication

### API Endpoints (Admin Only)

- `GET /api/orders/admin/dashboard` - Dashboard statistics
- `GET /api/orders/admin/all` - All orders with pagination
- `PUT /api/orders/admin/:id/status` - Update order status

### Access Instructions

1. Navigate to http://localhost:3000
2. Click "Login" in the navigation
3. Enter admin credentials
4. Access "Admin" link in navigation (only visible to admin)
5. Manage orders and view analytics

**Note:** This admin account is hardcoded and cannot be replicated through the registration system for security purposes.