import React from 'react';
import ProductVisualization from '../components/ProductVisualization';

const VisualizationPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-orthos-brown-300 font-delius">Orthos 3D Product Visualization</h1>
      <ProductVisualization />
    </div>
  );
};

export default VisualizationPage;