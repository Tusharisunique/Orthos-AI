import React, { useState } from 'react';

const AdminPanel = () => {
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!productName || !productDescription) {
      setMessage('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      // Call backend to generate embedding and save product
      const response = await fetch('http://localhost:5001/generate_embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: productName,
          description: productDescription,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'Failed to add product';
        } catch (e) {
          errorMessage = `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }
      
      await response.json();
      setMessage(`Product "${productName}" added successfully!`);
      setProductName('');
      setProductDescription('');
    } catch (error) {
      console.error('Error adding product:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Product</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="productName">
            Product Name
          </label>
          <input
            type="text"
            id="productName"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 text-black"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="productDescription">
            Product Description
          </label>
          <textarea
            id="productDescription"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 text-black"
            rows="4"
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            disabled={loading}
          ></textarea>
        </div>
        
        <button
          type="submit"
          className="w-full bg-orthos-brown-700 text-orthos-white py-2 px-4 rounded-md hover:bg-orthos-brown-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-orthos-brown-400 focus:ring-opacity-50 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Adding Product...' : 'Add Product'}
        </button>
      </form>
      
      {message && (
        <div className={`mt-4 p-3 rounded-md ${message.includes('Error') ? 'bg-red-900 text-orthos-white' : 'bg-orthos-brown-800 text-orthos-brown-200'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;