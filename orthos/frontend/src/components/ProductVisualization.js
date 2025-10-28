import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const ProductVisualization = () => {
  const mountRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Scene references
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const spheresRef = useRef({});
  const highlightSphereRef = useRef(null);
  
  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsCollection = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCollection);
        const productsList = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current || products.length === 0) return;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0); // Light background
    sceneRef.current = scene;
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xb98c4c, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xf8f8f8, 0.8);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);
    
    // Create 8-quadrant coordinate system
    // Main axes
    const axesHelper = new THREE.AxesHelper(4);
    scene.add(axesHelper);
    
    // Add coordinate grid
    const gridSize = 10;
    const gridDivisions = 10;
    const gridColor = 0x6f542e; // Brown grid
    const gridColor2 = 0x94703d; // Lighter brown grid
    
    // XY plane grids (z=0)
    const gridXYPos = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor2);
    gridXYPos.rotation.x = Math.PI / 2;
    gridXYPos.position.z = 0;
    scene.add(gridXYPos);
    
    // XZ plane grids (y=0)
    const gridXZPos = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor2);
    gridXZPos.position.y = 0;
    scene.add(gridXZPos);
    
    // YZ plane grids (x=0)
    const gridYZPos = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor2);
    gridYZPos.rotation.z = Math.PI / 2;
    gridYZPos.position.x = 0;
    scene.add(gridYZPos);
    
    // Add quadrant labels
    const createQuadrantLabel = (text, position) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 128;
      canvas.height = 64;
      context.fillStyle = '#333333';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.font = '24px Arial';
      context.fillStyle = '#00ff88';
      context.textAlign = 'center';
      context.fillText(text, canvas.width / 2, canvas.height / 2);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(position);
      sprite.scale.set(0.5, 0.25, 1);
      scene.add(sprite);
    };
    
    // Add labels for each quadrant
    createQuadrantLabel("Q1 (+++)", new THREE.Vector3(2, 2, 2));
    createQuadrantLabel("Q2 (-++)", new THREE.Vector3(-2, 2, 2));
    createQuadrantLabel("Q3 (--+)", new THREE.Vector3(-2, -2, 2));
    createQuadrantLabel("Q4 (+-+)", new THREE.Vector3(2, -2, 2));
    createQuadrantLabel("Q5 (++-)", new THREE.Vector3(2, 2, -2));
    createQuadrantLabel("Q6 (-+-)", new THREE.Vector3(-2, 2, -2));
    createQuadrantLabel("Q7 (---)", new THREE.Vector3(-2, -2, -2));
    createQuadrantLabel("Q8 (+--)", new THREE.Vector3(2, -2, -2));
    
    // Create spheres for products
    const spheres = {};
    products.forEach(product => {
      const { id, name, coordinates } = product;
      
      // Create sphere geometry - improved size and quality
      const geometry = new THREE.SphereGeometry(0.05, 32, 32);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0xb98c4c, // Orthos brown color
        emissive: 0x0d47a1,
        roughness: 0.2,
        metalness: 0.5
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      
      // Position based on coordinates
      sphere.position.set(
        coordinates.x * 3, // Scale for better visualization
        coordinates.y * 3,
        coordinates.z * 3
      );
      
      // Add to scene
      scene.add(sphere);
      
      // Store reference with product ID
      spheres[id] = {
        mesh: sphere,
        product: product
      };
      
      // Add text label with improved styling for dark theme
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 64;
      
      // Create two labels: 1) Always visible small name label, 2) Hover detailed label
      
      // 1. Small name label (always visible)
      const smallCanvas = document.createElement('canvas');
      const smallContext = smallCanvas.getContext('2d');
      smallCanvas.width = 128;
      smallCanvas.height = 32;
      
      // Semi-transparent background
      smallContext.fillStyle = 'rgba(149, 112, 61, 0.7)'; // Orthos brown with transparency
      smallContext.fillRect(0, 0, smallCanvas.width, smallCanvas.height);
      
      // Text styling - smaller and simpler
      smallContext.font = '10px Delius, cursive'; // Using Delius font
      smallContext.fillStyle = '#f8f8f8'; // Orthos white
      smallContext.textAlign = 'center';
      smallContext.textBaseline = 'middle';
      
      // Truncate name if too long
      let displayName = name;
      if (name.length > 15) {
        displayName = name.substring(0, 12) + '...';
      }
      smallContext.fillText(displayName, smallCanvas.width / 2, smallCanvas.height / 2);
      
      const smallTexture = new THREE.CanvasTexture(smallCanvas);
      const smallLabelMaterial = new THREE.SpriteMaterial({ 
        map: smallTexture,
        transparent: true
      });
      
      const smallLabel = new THREE.Sprite(smallLabelMaterial);
      smallLabel.position.set(
        coordinates.x * 3,
        coordinates.y * 3 + 0.08, // Position just above sphere
        coordinates.z * 3
      );
      smallLabel.scale.set(0.15, 0.05, 1); // Smaller scale
      smallLabel.visible = true; // Always visible
      scene.add(smallLabel);
      
      // 2. Detailed hover label
      // Dark background with brown tint
      context.fillStyle = 'rgba(37, 28, 15, 0.9)'; // Dark brown with high opacity
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add border
      context.strokeStyle = '#b98c4c'; // Orthos brown
      context.lineWidth = 2;
      context.strokeRect(2, 2, canvas.width-4, canvas.height-4);
      
      // Text styling
      context.shadowColor = 'rgba(0, 0, 0, 0.4)';
      context.shadowBlur = 3;
      context.font = 'bold 18px Delius, cursive'; // Using Delius font
      context.fillStyle = '#f8f8f8'; // Orthos white
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(name, canvas.width / 2, canvas.height / 2);
      
      const texture = new THREE.CanvasTexture(canvas);
      const labelMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true
      });
      
      // Hover label (only show on hover)
      const label = new THREE.Sprite(labelMaterial);
      label.position.set(
        coordinates.x * 3,
        coordinates.y * 3 + 0.2, // Position higher than small label
        coordinates.z * 3
      );
      label.scale.set(0.3, 0.15, 1);
      label.visible = false; // Hide by default
      scene.add(label);
      
      // Store label references with sphere
      spheres[id].label = label;
      spheres[id].smallLabel = smallLabel;
      
      // Add hover effect to show detailed label
      sphere.userData = { id, showLabel: () => { label.visible = true; }, hideLabel: () => { label.visible = false; } };
    });
    
    spheresRef.current = spheres;
    
    // Create highlight sphere (initially invisible) - adjusted size to 0.25
    const highlightGeometry = new THREE.SphereGeometry(0.25, 32, 32);
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xff9800,
      transparent: true,
      opacity: 0.5,
      wireframe: true
    });
    const highlightSphere = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlightSphere.visible = false;
    scene.add(highlightSphere);
    highlightSphereRef.current = highlightSphere;
    
    // Raycaster for click detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Mouse handlers for hover and click
    let hoveredSphere = null;
    
    const handleMouseMove = (event) => {
      // Calculate mouse position in normalized device coordinates
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);
      
      // Find intersections with product spheres
      const sphereObjects = Object.values(spheres).map(s => s.mesh);
      const intersects = raycaster.intersectObjects(sphereObjects);
      
      // Hide previous hovered sphere's label
      if (hoveredSphere && hoveredSphere.userData.hideLabel) {
        hoveredSphere.userData.hideLabel();
      }
      
      // Show new hovered sphere's label
      if (intersects.length > 0) {
        hoveredSphere = intersects[0].object;
        if (hoveredSphere.userData.showLabel) {
          hoveredSphere.userData.showLabel();
        }
      } else {
        hoveredSphere = null;
      }
    };
    
    const handleClick = (event) => {
      // Calculate mouse position in normalized device coordinates
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);
      
      // Find intersections with product spheres
      const sphereObjects = Object.values(spheres).map(s => s.mesh);
      const intersects = raycaster.intersectObjects(sphereObjects);
      
      if (intersects.length > 0) {
        const clickedSphere = intersects[0].object;
        
        // Find the product associated with this sphere
        const clickedProduct = Object.values(spheres).find(
          s => s.mesh === clickedSphere
        )?.product;
        
        if (clickedProduct) {
          selectProduct(clickedProduct);
        }
      }
    };
    
    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    const currentMount = mountRef.current;
    return () => {
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      // Dispose geometries and materials
      Object.values(spheres).forEach(({ mesh, label, smallLabel }) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
        
        if (label) {
          label.material.dispose();
        }
        
        if (smallLabel) {
          smallLabel.material.dispose();
        }
      });
      
      if (highlightSphere) {
        highlightSphere.geometry.dispose();
        highlightSphere.material.dispose();
      }
      
      renderer.dispose();
    };
  }, [products]);
  
  // Function to select a product and get recommendations
  const selectProduct = async (product) => {
    setSelectedProduct(product);
    
    try {
      // Reset all spheres to default color
      Object.values(spheresRef.current).forEach(({ mesh }) => {
        mesh.material.color.set(0x000000);
        mesh.material.emissive.set(0x222222);
      });
      
      // Highlight selected product
      const selectedSphere = spheresRef.current[product.id]?.mesh;
      if (selectedSphere) {
        selectedSphere.material.color.set(0x000000);
        selectedSphere.material.emissive.set(0x444444);
      }
      
      // Position highlight sphere at selected product
      if (highlightSphereRef.current) {
        highlightSphereRef.current.position.copy(selectedSphere.position);
        highlightSphereRef.current.visible = true;
      }
      
      // Fetch recommendations from backend
      try {
        const response = await fetch(`http://localhost:5001/recommend/${product.id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        setRecommendations(data.recommendations || []);
        setError(null);
        
        // Highlight recommended products with better colors
        (data.recommendations || []).forEach(rec => {
          const recSphere = spheresRef.current[rec.id]?.mesh;
          if (recSphere) {
            recSphere.material.color.set(0x00aa44);
            recSphere.material.emissive.set(0x003311);
          }
        });
      } catch (err) {
        console.error('Error getting recommendations:', err);
        setError('Failed to get recommendations. Please try again.');
        setRecommendations([]);
      }
    } catch (err) {
      console.error('Error getting recommendations:', err);
      setError('Failed to get recommendations');
    }
  };
  
  return (
    <div className="flex flex-col md:flex-row h-full">
      <div 
        ref={mountRef} 
        className="w-full md:w-3/4 h-[500px] bg-gray-100"
      />
      
      <div className="w-full md:w-1/4 p-4 bg-white text-gray-800 overflow-y-auto max-h-[500px] shadow-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Product Details</h2>
        
        {loading ? (
          <p>Loading products...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : selectedProduct ? (
          <div>
            <div className="mb-4 p-3 border border-gray-700 rounded-md bg-gray-800">
              <h3 className="font-bold text-cyan-300">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-300">{selectedProduct.description}</p>
              <div className="mt-2 text-xs text-cyan-200">
                <p>X: {selectedProduct.coordinates.x.toFixed(4)}</p>
                <p>Y: {selectedProduct.coordinates.y.toFixed(4)}</p>
                <p>Z: {selectedProduct.coordinates.z.toFixed(4)}</p>
              </div>
            </div>
            
            <h3 className="font-bold mt-4 mb-2">Similar Products</h3>
            {recommendations.length > 0 ? (
              <ul className="space-y-2">
                {recommendations.map(rec => (
                  <li 
                  key={rec.id} 
                  className="mb-2 p-2 border border-gray-200 rounded bg-white hover:bg-gray-100 cursor-pointer shadow-sm"
                  onClick={() => {
                    const product = products.find(p => p.id === rec.id);
                    if (product) selectProduct(product);
                  }}
                >
                  <div className="font-medium text-gray-800">{rec.name}</div>
                  <div className="text-sm text-gray-600">Similarity: {(rec.similarity * 100).toFixed(1)}%</div>
                </li>
                ))}
              </ul>
            ) : (
              <p>No similar products found</p>
            )}
            
            <h3 className="font-bold mt-6 mb-2">All Products</h3>
            <ul className="space-y-1 border border-gray-200 rounded-md p-2 max-h-60 overflow-y-auto">
              {products.map(product => (
                <li 
                  key={product.id} 
                  className={`p-1 text-sm rounded hover:bg-gray-100 cursor-pointer ${
                    selectedProduct.id === product.id ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => selectProduct(product)}
                >
                  {product.name}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <p className="mb-4">Select a product to see details</p>
            
            <h3 className="font-bold mt-4 mb-2">All Products</h3>
            <ul className="space-y-1 border border-gray-200 rounded-md p-2 max-h-60 overflow-y-auto">
              {products.map(product => (
                <li 
                  key={product.id} 
                  className="p-1 text-sm rounded hover:bg-gray-100 cursor-pointer"
                  onClick={() => selectProduct(product)}
                >
                  {product.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductVisualization;