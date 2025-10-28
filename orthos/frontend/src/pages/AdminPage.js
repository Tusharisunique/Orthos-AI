import React from 'react';
import AdminPanel from '../components/AdminPanel';

const AdminPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-orthos-brown-300 font-delius">Orthos Admin</h1>
      <AdminPanel />
    </div>
  );
};

export default AdminPage;