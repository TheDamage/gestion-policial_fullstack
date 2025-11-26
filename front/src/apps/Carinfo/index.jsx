import { Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import Captura from './pages/Captura';
import Historial from './pages/Historial';

export default function CarInfo() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link to="/dashboard" className="text-sm text-blue-200 hover:text-white mb-1 block">
                ← Volver al Dashboard
              </Link>
              <h1 className="text-2xl font-bold">🚗 CarInfo</h1>
              <p className="text-blue-200 text-sm">Identificación Vehicular Táctica</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-4 py-3">
            <NavLink to="/carinfo">Nueva Consulta</NavLink>
            <NavLink to="/carinfo/historial">Historial</NavLink>
          </div>
        </div>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Captura />} />
        <Route path="/historial" element={<Historial />} />
      </Routes>
    </div>
  );
}

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md transition"
    >
      {children}
    </Link>
  );
}