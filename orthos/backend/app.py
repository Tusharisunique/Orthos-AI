from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import numpy as np
from firebase_admin import credentials, firestore, initialize_app
from dotenv import load_dotenv
import ctypes
import tempfile
import json

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize Firebase
cred = credentials.Certificate("firebase-key.json")
firebase_app = initialize_app(cred)
db = firestore.client()

# Load the KD-tree C library
try:
    kdtree_lib = ctypes.CDLL('./libkdtree.so')
except OSError:
    print("Warning: Could not load KD-tree library. Recommendations may not work.")

# Mistral AI API configuration
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "your_default_key_here")
MISTRAL_API_URL = "https://api.mistral.ai/v1/embeddings"

@app.route('/generate_embedding', methods=['POST'])
def generate_embedding():
    """
    Generate embedding for a product using Mistral AI API with mean pooling and L2 normalization
    """
    try:
        data = request.json
        if not data or 'description' not in data or 'name' not in data:
            return jsonify({"error": "Missing product name or description"}), 400
        
        # Create full text with mean pooling of multiple fields
        category = data.get('category', '')
        tags = data.get('tags', '')
        full_text = f"{data['name']}. {category}. {data['description']}. {tags}"
        
        # Call Mistral AI API to get embedding
        headers = {
            "Authorization": f"Bearer {MISTRAL_API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            MISTRAL_API_URL,
            headers=headers,
            json={
                "model": "mistral-embed",
                "input": full_text
            }
        )
        
        if response.status_code != 200:
            return jsonify({"error": f"Mistral API error: {response.text}"}), 500
        
        # Extract embedding from response
        embedding = np.array(response.json()['data'][0]['embedding'])
        
        # Normalize embedding to unit length (L2 norm)
        embedding = embedding / np.linalg.norm(embedding)
        
        # Convert back to list for storage
        embedding = embedding.tolist()
        
        # Extract category information for better grouping
        category = data.get('category', '')
        
        # Use PCA-like approach to ensure similar products are grouped together
        # We'll use a weighted approach where the first dimension is heavily influenced by category
        # This ensures products of the same category are placed closer together
        
        # Create a category factor (simple hash of category string)
        category_factor = 0
        if category:
            for char in category:
                category_factor += ord(char)
            category_factor = (category_factor % 100) / 100  # Normalize between 0-1
        
        # Create coordinates with category influence
        coordinates = {
            "x": embedding[0] * 0.7 + category_factor * 0.3,  # 30% influence from category
            "y": embedding[1],
            "z": embedding[2]
        }
        
        # Create product document in Firestore
        product_ref = db.collection('products').document()
        product_data = {
            "id": product_ref.id,
            "name": data['name'],
            "description": data['description'],
            "category": data.get('category', ''),
            "tags": data.get('tags', ''),
            "embedding": embedding,
            "coordinates": coordinates
        }
        
        product_ref.set(product_data)
        
        return jsonify({
            "id": product_ref.id,
            "name": data['name'],
            "coordinates": coordinates,
            "message": "Product added successfully"
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/recommend/<id>', methods=['GET'])
def recommend(id):
    """
    Find nearest products to the given product ID using KD-tree C implementation
    """
    try:
        # Get the product by ID
        product_doc = db.collection('products').document(id).get()
        if not product_doc.exists:
            return jsonify({"error": "Product not found"}), 404
        
        product = product_doc.to_dict()
        
        # Get all products
        products = db.collection('products').stream()
        all_products = []
        
        # Create temporary files for KD-tree input and output
        with tempfile.NamedTemporaryFile(mode='w', delete=False) as input_file:
            # Write header
            input_file.write("id,name,x,y,z\n")
            
            # Write all products to input file
            for doc in products:
                doc_data = doc.to_dict()
                all_products.append({
                    "id": doc.id,
                    "name": doc_data['name'],
                    "description": doc_data.get('description', ''),
                    "coordinates": doc_data['coordinates']
                })
                
                # Write to input file for KD-tree
                input_file.write(f"{doc.id},{doc_data['name']},{doc_data['coordinates']['x']},{doc_data['coordinates']['y']},{doc_data['coordinates']['z']}\n")
            
            input_filename = input_file.name
        
        # Create output file
        output_file = tempfile.NamedTemporaryFile(delete=False)
        output_filename = output_file.name
        output_file.close()
        
        # Call the C program using system command
        radius = 0.5  # Adjust radius as needed
        os.system(f"./kdtree_exec {input_filename} {output_filename} {id} {radius}")
        
        # Read recommendations from output file
        recommended = []
        try:
            with open(output_filename, 'r') as f:
                # Skip header
                next(f)
                
                for line in f:
                    parts = line.strip().split(',')
                    if len(parts) >= 5:
                        rec_id = parts[0]
                        rec_name = parts[1]
                        x = float(parts[2])
                        y = float(parts[3])
                        z = float(parts[4])
                        
                        # Find the full product data
                        rec_product = next((p for p in all_products if p["id"] == rec_id), None)
                        if rec_product and rec_id != id:  # Exclude the target product
                            # Calculate distance for sorting
                            target_coords = [
                                product['coordinates']['x'],
                                product['coordinates']['y'],
                                product['coordinates']['z']
                            ]
                            coords = [x, y, z]
                            distance = np.sqrt(sum((a - b) ** 2 for a, b in zip(target_coords, coords)))
                            
                            # Only include products that are inside or at the boundary of the sphere
                            # The radius used in the KD-tree search is 0.5, so we filter by that distance
                            if distance <= radius:
                                recommended.append({
                                    "id": rec_id,
                                    "name": rec_name,
                                    "coordinates": {"x": x, "y": y, "z": z},
                                    "distance": float(distance),
                                    "similarity": float(1.0 / (1.0 + distance))
                                })
        except Exception as e:
            print(f"Error reading recommendations: {e}")
        
        # Sort by distance
        recommended = sorted(recommended, key=lambda x: x['distance'])
        
        # Clean up temporary files
        os.unlink(input_filename)
        os.unlink(output_filename)
        
        return jsonify({
            "product": {
                "id": product['id'],
                "name": product['name'],
                "coordinates": product['coordinates']
            },
            "recommendations": recommended,
            "all_products": all_products
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/products', methods=['GET'])
def get_products():
    """
    Get all products from Firestore
    """
    try:
        products = db.collection('products').stream()
        product_list = []
        
        for doc in products:
            doc_data = doc.to_dict()
            product_list.append({
                "id": doc.id,
                "name": doc_data['name'],
                "description": doc_data.get('description', ''),
                "coordinates": doc_data['coordinates']
            })
        
        return jsonify({"products": product_list}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Try different ports if 5000 is in use
    port = 5001  # Changed default port to 5001
    while port < 5010:
        try:
            app.run(debug=True, host='0.0.0.0', port=port)
            break
        except OSError:
            print(f"Port {port} is in use, trying port {port+1}")
            port += 1