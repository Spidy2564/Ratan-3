import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { WalletProvider } from './components/WalletProvider'
import AdminDashboard from './pages/AdminDashboard'
import AdminLogin from './pages/AdminLogin'
import UserConnect from './pages/UserConnect'
import TransactionApproval from './pages/TransactionApproval'
import TransactionHistory from './pages/TransactionHistory'

function App() {
  return (
    <WalletProvider>
      <div className="App">
        <Routes>
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/transactions" element={<TransactionHistory />} />
          <Route path="/connect/:linkId" element={<UserConnect />} />
          <Route path="/approve-transaction/:transactionId" element={<TransactionApproval />} />
          <Route path="/" element={<AdminLogin />} />
        </Routes>
      </div>
    </WalletProvider>
  )
}

export default App
