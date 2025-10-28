import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import VisualizationPage from './pages/VisualizationPage';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-orthos-black font-delius text-orthos-white">
      <nav className="bg-orthos-brown-800 shadow-md border-b border-orthos-brown-600">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-orthos-white">ORTHOS</div>
            <div className="space-x-6">
              <Link to="/" className="text-orthos-white hover:text-orthos-brown-200 transition-colors duration-300">Visualization</Link>
              <Link to="/admin" className="text-orthos-white hover:text-orthos-brown-200 transition-colors duration-300">Admin</Link>
            </div>
          </div>
        </div>
      </nav>
      
      <main>
        <Routes>
          <Route path="/" element={<VisualizationPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      
      <footer className="bg-orthos-brown-900 py-4 mt-8 border-t border-orthos-brown-700">
        <div className="container mx-auto px-4 text-center text-orthos-brown-300">
          <p>Orthos - Semantic 3D Product Recommendation System</p>
        </div>
      </footer>
    </div>
  );
}

export default App;