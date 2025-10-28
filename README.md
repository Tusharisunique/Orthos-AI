# Orthos: Semantic 3D Product Recommendation System

## Project Overview

Orthos is a semantic 3D product recommendation system that visualizes products in a three-dimensional space based on their semantic similarities. The system uses Mistral AI for generating embeddings, which are then converted to 3D coordinates for visualization. Products with similar characteristics appear closer to each other in the 3D space, allowing users to intuitively explore related products.

## Core Features

### Admin Panel
- Add new products with name and description
- Automatically generate embeddings and 3D coordinates using Mistral AI
- Store product data in Firebase Firestore

### User Visualization Page
- Interactive 3D visualization of products using Three.js
- 8-quadrant coordinate system for better spatial understanding
- Product selection and recommendation display
- Complete product listing for easy navigation

## Technical Architecture

### Backend (Flask)
- **Flask Server**: RESTful API endpoints for product management and recommendations
- **Mistral AI Integration**: Generates embeddings from product descriptions
- **Firebase Firestore**: Database for storing product information and embeddings
- **KD-Tree Implementation**: C program for efficient proximity search in 3D space

### Frontend (React)
- **React Components**: Modular UI components for admin and visualization pages
- **Three.js**: 3D visualization of product relationships
- **Firebase SDK**: Direct integration with Firestore for data retrieval
- **Tailwind CSS**: Styling and responsive design

## Data Flow

1. **Product Creation**:
   - Admin enters product name and description
   - Backend sends description to Mistral AI API
   - Mistral AI generates embeddings
   - Embeddings are converted to 3D coordinates
   - Product data is stored in Firebase Firestore

2. **Visualization**:
   - Frontend fetches all products from Firebase
   - Products are rendered as spheres in 3D space
   - User can select products to see details
   - Backend calculates nearest products using KD-tree algorithm
   - Similar products are highlighted in the visualization

3. **Recommendation**:
   - When a product is selected, backend finds similar products
   - Similarity is calculated based on Euclidean distance in 3D space
   - Top 5 most similar products are returned and displayed

## System Components

### Backend Endpoints

1. **`/generate_embedding` (POST)**
   - Receives product name and description
   - Generates embeddings using Mistral AI
   - Converts embeddings to 3D coordinates
   - Stores product in Firebase
   - Returns product ID and coordinates

2. **`/recommend/<id>` (GET)**
   - Finds similar products to the given product ID
   - Uses KD-tree approach for proximity search
   - Returns the target product, recommendations, and all products

3. **`/products` (GET)**
   - Returns all products stored in the database

### Frontend Components

1. **`AdminPanel.js`**
   - Form for adding new products
   - Communicates with backend to generate embeddings

2. **`ProductVisualization.js`**
   - 3D visualization using Three.js
   - Interactive product selection
   - Displays product details and recommendations
   - Shows all available products in a list

3. **`App.js`**
   - Main application component with routing
   - Navigation between admin and visualization pages

## Setup and Installation

### Prerequisites
- Python 3.8+
- Node.js and npm
- Firebase account
- Mistral AI API key

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd orthos/backend
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Set up environment variables in `.env`:
   ```
   MISTRAL_API_KEY=your_mistral_api_key
   FLASK_ENV=development
   ```

4. Configure Firebase by updating `firebase-key.json` with your Firebase service account key.

5. Run the Flask server:
   ```
   python app.py
   ```
   The server will automatically find an available port starting from 5000.

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd orthos/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Update Firebase configuration in `src/firebase.js` with your Firebase project details.

4. Start the development server:
   ```
   npm start
   ```

## Usage

1. **Adding Products**:
   - Navigate to the Admin Panel
   - Enter product name and description
   - Click "Submit" to add the product

2. **Exploring Products**:
   - Navigate to the Visualization Page
   - Interact with the 3D visualization using mouse controls:
     - Left-click to select products
     - Right-click and drag to rotate the view
     - Scroll to zoom in/out
   - View product details and recommendations in the side panel
   - Use the product list to quickly find and select specific products

## Technical Implementation Details

### Embedding Generation
Mistral AI's API is used to generate embeddings from product descriptions. These embeddings capture the semantic meaning of products, which are then converted to 3D coordinates for visualization.

### KD-Tree for Proximity Search
A KD-tree data structure is implemented in C for efficient proximity search in 3D space. This allows the system to quickly find products that are close to each other in the semantic space.

### 8-Quadrant Coordinate System
The visualization uses an 8-quadrant coordinate system with grid helpers and quadrant labels for better spatial understanding. This helps users navigate the 3D space more intuitively.

## Future Enhancements

1. **User Authentication**: Add user accounts and personalized recommendations
2. **Advanced Filtering**: Filter products by categories or attributes
3. **Improved Visualization**: Add more visual cues for product relationships
4. **Performance Optimization**: Implement more efficient algorithms for large product catalogs
5. **Mobile Support**: Optimize the visualization for mobile devices

## Conclusion

Orthos provides an innovative way to explore product relationships through 3D visualization. By leveraging Mistral AI for semantic understanding and Three.js for interactive visualization, the system offers an intuitive and engaging product discovery experience.