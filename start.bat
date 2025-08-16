@echo off
echo Starting Trust Wallet Admin Dashboard...
echo.

echo Installing backend dependencies...
cd backend
call npm install

echo.
echo Installing frontend dependencies...
cd ..\frontend
call npm install

echo.
echo Setup complete! 
echo.
echo To start the application:
echo 1. Start MongoDB on your system
echo 2. In one terminal: cd backend && npm run dev  
echo 3. In another terminal: cd frontend && npm run dev
echo 4. Open http://localhost:3000/admin
echo 5. Login with: admin / admin123
echo.
pause
