# Trust Wallet Admin Dashboard

A complete web3 application that allows admins to generate secure links for users to connect their Trust Wallet, and then interact with those wallets from the admin dashboard.

## Features

- **Admin Dashboard**: Generate secure links and manage user connections
- **User Connection**: Simple interface for users to connect their Trust Wallet
- **Wallet Integration**: View balances, transaction history, and wallet information
- **Security**: JWT authentication, link expiration, and secure wallet interactions
- **Real-time Updates**: Live connection status and wallet data

## Tech Stack

- **Backend**: Node.js + Express + MongoDB
- **Frontend**: React + Vite
- **Blockchain**: Ethereum (with Trust Wallet support)
- **Authentication**: JWT tokens
- **Database**: MongoDB with automatic cleanup

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Trust Wallet or MetaMask browser extension

### Installation

1. **Clone and setup the project:**
   ```bash
   cd trust-wallet-admin
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB URI and other settings
   npm run dev
   ```

3. **Setup Frontend (in a new terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application:**
   - Admin Dashboard: http://localhost:3000/admin
   - Default credentials: `admin` / `admin123`

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/trustwallet-admin
JWT_SECRET=your-super-secret-jwt-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY
```

## How It Works

1. **Admin generates a link** in the dashboard
2. **Share the link** with the user (via email, messaging, etc.)
3. **User opens the link** and connects their Trust Wallet
4. **Admin can now interact** with the connected wallet from the dashboard

## API Endpoints

### Admin Routes
- `POST /api/admin/login` - Admin login
- `POST /api/admin/generate-link` - Generate user link
- `GET /api/admin/users` - Get all users
- `GET /api/admin/user/:linkId` - Get specific user
- `DELETE /api/admin/user/:linkId` - Delete user

### User Routes
- `GET /api/user/verify/:linkId` - Verify link validity
- `POST /api/user/connect/:linkId` - Connect wallet
- `POST /api/user/activity/:linkId` - Update activity

### Wallet Routes
- `GET /api/wallet/balance/:linkId` - Get wallet balance
- `GET /api/wallet/info/:linkId` - Get wallet information
- `GET /api/wallet/transactions/:linkId` - Get transaction history

## Security Features

- **Link Expiration**: Links automatically expire after 24 hours
- **JWT Authentication**: Secure admin authentication
- **Database Cleanup**: Expired links are automatically removed
- **Wallet Validation**: Proper wallet address validation
- **CORS Protection**: Configured for secure cross-origin requests

## Customization

### Changing Link Expiration
Edit the `expiresAt` field in `backend/models/User.js`:
```javascript
expiresAt: {
  type: Date,
  default: () => new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
}
```

### Adding More Blockchain Networks
1. Add RPC URLs to your `.env` file
2. Update the wallet routes in `backend/routes/wallet.js`
3. Modify the frontend to handle multiple networks

### Custom Admin Authentication
Replace the simple username/password check in `backend/routes/admin.js` with a proper User model and hashed passwords.

## Production Deployment

### Backend
1. Set up a production MongoDB database
2. Use environment variables for all sensitive data
3. Enable HTTPS
4. Set up proper logging and monitoring

### Frontend
1. Build the production bundle: `npm run build`
2. Serve static files with nginx or similar
3. Configure proper domain and SSL

### Docker Support
Create a `docker-compose.yml` for easy deployment:

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/trustwallet-admin
    depends_on:
      - mongo
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
  
  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

## Troubleshooting

### Common Issues

1. **"MetaMask/Trust Wallet not detected"**
   - Ensure the wallet extension is installed and enabled
   - Try refreshing the page

2. **"Connection failed"**
   - Check if the backend server is running
   - Verify the API endpoints are accessible

3. **"Invalid link"**
   - Links expire after 24 hours by default
   - Generate a new link from the admin dashboard

4. **Database connection issues**
   - Ensure MongoDB is running
   - Check the MONGODB_URI in your .env file

### Development Tips

- Use the browser's developer tools to check for console errors
- Monitor network requests to debug API issues
- Check MongoDB logs for database-related problems

## License

MIT License - feel free to modify and use for your projects.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please create an issue in the GitHub repository.

---

**⚠️ Important Security Notice:**
This application is for educational/development purposes. For production use, implement additional security measures including proper authentication, rate limiting, and comprehensive input validation.
