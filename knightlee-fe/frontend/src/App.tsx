import React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"

// pages
import Login from "./pages/Login"
import Signup from "./pages/Signup"

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Additional pages */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* Optional */}
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Fallback if no route match */}
        <Route path="*" element={<h1 className="text-center pt-10 text-xl">404 — Page Not Found</h1>} />
      </Routes>
    </Router>
  )
}
