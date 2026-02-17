"""
Artscape CLIP Recommendation Service
Flask API for serving artwork recommendations using CLIP embeddings

This service provides:
- Image embedding generation using CLIP
- Similar artwork recommendations
- Text-based artwork search
- Personalized user recommendations
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import requests
from io import BytesIO
import numpy as np
from pymongo import MongoClient
from bson import ObjectId
import os
import logging
from functools import lru_cache
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
allowed_origins = [
    os.getenv('FRONTEND_URL', 'http://localhost:5500'),
]

CORS(app, origins=allowed_origins, supports_credentials=True)
  # Enable CORS for all routes

# Global variables
model = None
processor = None
db = None
device = None

# Configuration class
class Config:
    """Configuration for the recommendation service"""
    
    # MongoDB Configuration
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    DB_NAME = os.getenv('DB_NAME', 'test')
    
    # Cloudinary Configuration (optional - for image handling)
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME', '')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY', '')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET', '')
    
    # Model Configuration
    MODEL_NAME = os.getenv('MODEL_NAME', 'openai/clip-vit-base-patch32')
    
    # Model storage location - Options:
    # 1. None: Auto-download to default HuggingFace cache (~/.cache/huggingface)
    # 2. "./models": Store in local models/ directory (recommended for production)
    # 3. "/path/to/shared/models": Use custom path
    MODEL_CACHE_DIR = os.getenv('MODEL_CACHE_DIR', './models')
    
    # Processing Configuration
    BATCH_SIZE = int(os.getenv('BATCH_SIZE', 32))
    TOP_K = int(os.getenv('TOP_K', 20))
    
    # Server Configuration
    PORT = int(os.getenv('PORT', 5001))


def initialize_model():
    """
    Initialize CLIP model and processor
    Downloads model if not present in cache directory
    """
    global model, processor, device
    
    logger.info("=" * 50)
    logger.info("Initializing CLIP model...")
    
    # Determine device (GPU if available, else CPU)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Using device: {device}")
    
    if device == "cuda":
        gpu_name = torch.cuda.get_device_name(0)
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1e9
        logger.info(f"GPU: {gpu_name} ({gpu_memory:.2f} GB)")
    else:
        logger.info("No GPU available, using CPU (slower but functional)")
    
    # Create model cache directory if using local storage
    if Config.MODEL_CACHE_DIR:
        model_dir = Path(Config.MODEL_CACHE_DIR)
        model_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Model cache directory: {model_dir.absolute()}")
        
        # Check if model already exists
        if (model_dir / f"models--{Config.MODEL_NAME.replace('/', '--')}").exists():
            logger.info("Found existing model in cache")
        else:
            logger.info("Model not found in cache, will download (~600MB, 5-10 minutes)")
    
    try:
        # Load model and processor
        if Config.MODEL_CACHE_DIR:
            logger.info(f"Loading model from: {Config.MODEL_CACHE_DIR}")
            model = CLIPModel.from_pretrained(
                Config.MODEL_NAME,
                cache_dir=Config.MODEL_CACHE_DIR
            ).to(device)
            processor = CLIPProcessor.from_pretrained(
                Config.MODEL_NAME,
                cache_dir=Config.MODEL_CACHE_DIR
            )
        else:
            logger.info("Loading model from default HuggingFace cache")
            model = CLIPModel.from_pretrained(Config.MODEL_NAME).to(device)
            processor = CLIPProcessor.from_pretrained(Config.MODEL_NAME)
        
        # Set model to evaluation mode
        model.eval()
        
        logger.info("✓ Model initialized successfully")
        logger.info(f"Model: {Config.MODEL_NAME}")
        logger.info(f"Embedding dimension: 512")
        logger.info("=" * 50)
        
    except Exception as e:
        logger.error(f"Failed to initialize model: {str(e)}")
        raise


def initialize_database():
    """
    Initialize MongoDB connection and create indexes
    """
    global db
    
    logger.info("Connecting to MongoDB...")
    
    try:
        client = MongoClient(Config.MONGODB_URI, serverSelectionTimeoutMS=5000)
        
        # Test connection
        client.server_info()
        
        db = client[Config.DB_NAME]
        
        # Create indexes for better query performance
        logger.info("Creating database indexes...")
        db.artworks.create_index([("clip_embedding", 1)])
        db.artworks.create_index([("artist", 1)])
        db.artworks.create_index([("createdAt", -1)])
        
        # Count existing artworks
        artwork_count = db.artworks.count_documents({})
        embedding_count = db.artworks.count_documents({"clip_embedding": {"$exists": True}})
        
        logger.info(f"✓ Database connected successfully")
        logger.info(f"Database: {Config.DB_NAME}")
        logger.info(f"Total artworks: {artwork_count}")
        logger.info(f"Artworks with embeddings: {embedding_count}")
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        raise


@lru_cache(maxsize=1000)
def load_image_from_url(url):
    """
    Load and cache image from URL
    
    Args:
        url: Image URL
        
    Returns:
        PIL.Image or None if failed
    """
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        image = Image.open(BytesIO(response.content)).convert('RGB')
        return image
    except Exception as e:
        logger.error(f"Error loading image from {url}: {str(e)}")
        return None


def get_image_embedding(image):
    """
    Generate CLIP embedding for an image
    
    Args:
        image: PIL.Image object
        
    Returns:
        List of floats (512-dimensional vector) or None if failed
    """
    try:
        # Preprocess image
        inputs = processor(images=image, return_tensors="pt").to(device)
        
        # Generate embedding
        with torch.no_grad():
            image_features = model.get_image_features(**inputs)
            # Normalize to unit length
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
        
        # Convert to list
        embedding = image_features.cpu().numpy()[0].tolist()
        return embedding
        
    except Exception as e:
        logger.error(f"Error generating image embedding: {str(e)}")
        return None


def get_text_embedding(text):
    """
    Generate CLIP embedding for text
    
    Args:
        text: Text string
        
    Returns:
        List of floats (512-dimensional vector) or None if failed
    """
    try:
        # Preprocess text
        inputs = processor(text=[text], return_tensors="pt", padding=True).to(device)
        
        # Generate embedding
        with torch.no_grad():
            text_features = model.get_text_features(**inputs)
            # Normalize to unit length
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)
        
        # Convert to list
        embedding = text_features.cpu().numpy()[0].tolist()
        return embedding
        
    except Exception as e:
        logger.error(f"Error generating text embedding: {str(e)}")
        return None


def cosine_similarity(embedding1, embedding2):
    """
    Calculate cosine similarity between two embeddings
    
    Args:
        embedding1: First embedding (list or numpy array)
        embedding2: Second embedding (list or numpy array)
        
    Returns:
        Float between 0 and 1 (higher = more similar)
    """
    return float(np.dot(embedding1, embedding2))


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/', methods=['GET'])
def root():
    """Root endpoint to verify service is running"""
    return jsonify({
        'service': 'artscape-recommendation-service',
        'status': 'running',
        'endpoints': ['/health', '/recommend/similar', '/recommend/text', '/recommend/personalized']
    })

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    
    Returns:
        JSON with service status
    """
    return jsonify({
        'status': 'healthy',
        'service': 'artscape-recommendation-service',
        'device': device,
        'model_loaded': model is not None,
        'db_connected': db is not None,
        'model_name': Config.MODEL_NAME
    })


@app.route('/generate-embedding', methods=['POST'])
def generate_embedding():
    """
    Generate and store embedding for a single artwork
    
    Request body:
        {
            "artwork_id": "artwork_id",
            "image_url": "https://..."
        }
    
    Returns:
        JSON with success status
    """
    try:
        data = request.json
        artwork_id = data.get('artwork_id')
        image_url = data.get('image_url')
        
        if not artwork_id or not image_url:
            return jsonify({
                'success': False,
                'error': 'Missing artwork_id or image_url'
            }), 400
        
        logger.info(f"Generating embedding for artwork: {artwork_id}")
        
        # Load image
        image = load_image_from_url(image_url)
        if image is None:
            return jsonify({
                'success': False,
                'error': 'Failed to load image'
            }), 400
        
        # Generate embedding
        embedding = get_image_embedding(image)
        if embedding is None:
            return jsonify({
                'success': False,
                'error': 'Failed to generate embedding'
            }), 500
        
        # Store in database
        result = db.artworks.update_one(
            {'_id': ObjectId(artwork_id)},
            {
                '$set': {
                    'clip_embedding': embedding,
                    'embedding_updated_at': datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({
                'success': False,
                'error': 'Artwork not found'
            }), 404
        
        logger.info(f"✓ Embedding stored for artwork: {artwork_id}")
        
        return jsonify({
            'success': True,
            'artwork_id': artwork_id,
            'embedding_dimension': len(embedding)
        })
        
    except Exception as e:
        logger.error(f"Error in generate_embedding: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/recommend/similar', methods=['POST'])
def recommend_similar():
    """
    Get similar artworks based on an artwork
    
    Request body:
        {
            "artwork_id": "artwork_id",
            "top_k": 20,  // optional
            "exclude_artist": false  // optional
        }
    
    Returns:
        JSON with recommendations
    """
    try:
        data = request.json
        artwork_id = data.get('artwork_id')
        top_k = data.get('top_k', Config.TOP_K)
        exclude_artist = data.get('exclude_artist', False)
        
        if not artwork_id:
            return jsonify({
                'success': False,
                'error': 'Missing artwork_id'
            }), 400
        
        logger.info(f"Finding similar artworks for: {artwork_id}")
        
        # Get source artwork
        source_artwork = db.artworks.find_one({'_id': ObjectId(artwork_id)})
        if not source_artwork:
            return jsonify({
                'success': False,
                'error': 'Artwork not found'
            }), 404
        
        if 'clip_embedding' not in source_artwork:
            return jsonify({
                'success': False,
                'error': 'Artwork does not have an embedding. Generate it first.'
            }), 404
        
        source_embedding = source_artwork['clip_embedding']
        
        # Build query
        query = {
            '_id': {'$ne': ObjectId(artwork_id)},
            'clip_embedding': {'$exists': True}
        }
        
        if exclude_artist and 'artist' in source_artwork:
            query['artist'] = {'$ne': source_artwork['artist']}
        
        # Get all artworks with embeddings
        artworks = list(db.artworks.find(query))
        
        if not artworks:
            return jsonify({
                'success': True,
                'source_artwork_id': artwork_id,
                'recommendations': [],
                'total_compared': 0
            })
        
        # Calculate similarities
        similarities = []
        for artwork in artworks:
            similarity = cosine_similarity(source_embedding, artwork['clip_embedding'])
            tags = artwork.get('tags', [])
            if isinstance(tags, str):
                tags = [t.strip() for t in tags.split(',')] if tags else []
            similarities.append({
                'artwork_id': str(artwork['_id']),
                'similarity': float(similarity),
                'title': artwork.get('title', 'Untitled'),
                'artist_id': str(artwork.get('artist', 'Unknown')) if artwork.get('artist') else 'Unknown',
                'image': artwork.get('image', ''),
                'price': artwork.get('price', 0),
                'tags': tags if isinstance(tags, list) else []
            })
        
        # Sort by similarity and get top K
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        recommendations = similarities[:top_k]
        
        logger.info(f"✓ Found {len(recommendations)} similar artworks")
        
        return jsonify({
            'success': True,
            'source_artwork_id': artwork_id,
            'recommendations': recommendations,
            'total_compared': len(similarities)
        })
        
    except Exception as e:
        logger.error(f"Error in recommend_similar: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/recommend/text', methods=['POST'])
def recommend_by_text():
    """
    Get artworks based on text description
    
    Request body:
        {
            "query": "abstract painting with warm colors",
            "top_k": 20  // optional
        }
    
    Returns:
        JSON with recommendations
    """
    try:
        data = request.json
        query_text = data.get('query')
        top_k = data.get('top_k', Config.TOP_K)
        
        if not query_text:
            return jsonify({
                'success': False,
                'error': 'Missing query text'
            }), 400
        
        logger.info(f"Text search: '{query_text}'")
        
        # Generate text embedding
        text_embedding = get_text_embedding(query_text)
        if text_embedding is None:
            return jsonify({
                'success': False,
                'error': 'Failed to generate text embedding'
            }), 500
        
        # Get all artworks with embeddings
        artworks = list(db.artworks.find({'clip_embedding': {'$exists': True}}))
        
        if not artworks:
            return jsonify({
                'success': True,
                'query': query_text,
                'recommendations': [],
                'total_compared': 0
            })
        
        # Calculate similarities
        similarities = []
        for artwork in artworks:
            similarity = cosine_similarity(text_embedding, artwork['clip_embedding'])
            similarities.append({
                'artwork_id': str(artwork['_id']),
                'similarity': float(similarity),
                'title': artwork.get('title', 'Untitled'),
                'artist_id': str(artwork.get('artist', 'Unknown')) if artwork.get('artist') else 'Unknown',
                'image': artwork.get('image', ''),
                'price': artwork.get('price', 0)
            })
        
        # Sort by similarity and get top K
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        recommendations = similarities[:top_k]
        
        logger.info(f"✓ Found {len(recommendations)} matching artworks")
        
        return jsonify({
            'success': True,
            'query': query_text,
            'recommendations': recommendations,
            'total_compared': len(similarities)
        })
        
    except Exception as e:
        logger.error(f"Error in recommend_by_text: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/recommend/personalized', methods=['POST'])
def recommend_personalized():
    """
    Get personalized recommendations based on user history
    
    Request body:
        {
            "user_id": "user_id",
            "top_k": 20  // optional
        }
    
    Returns:
        JSON with recommendations
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        top_k = data.get('top_k', Config.TOP_K)
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'Missing user_id'
            }), 400
        
        logger.info(f"Getting personalized recommendations for user: {user_id}")
        
        # Get user's liked/purchased artworks
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        liked_artwork_ids = [str(a) for a in user.get('likedArtworks', [])]
        saved_artwork_ids = [str(a) for a in user.get('savedArtworks', [])]
        purchased_artwork_ids = [str(a) for a in user.get('purchasedArtworks', [])]
        cart_additions = [str(a) for a in user.get('cartAdditions', [])]
        viewed = user.get('viewedArtworks', [])
        viewed_artwork_ids = [str(v.get('artwork')) for v in viewed if v.get('artwork')]
        
        # Combine interactions (saves, likes, purchases, cart = strong; views = additional)
        interaction_ids = list(set(
            liked_artwork_ids + saved_artwork_ids + purchased_artwork_ids + cart_additions + viewed_artwork_ids
        ))
        
        if not interaction_ids:
            return jsonify({
                'success': True,
                'user_id': user_id,
                'based_on_items': 0,
                'recommendations': [],
                'message': 'No user history available. Like or purchase artworks to get personalized recommendations.'
            })
        
        # Get embeddings of user's interacted artworks
        interacted_artworks = list(db.artworks.find({
            '_id': {'$in': [ObjectId(aid) for aid in interaction_ids]},
            'clip_embedding': {'$exists': True}
        }))
        
        if not interacted_artworks:
            return jsonify({
                'success': True,
                'user_id': user_id,
                'based_on_items': 0,
                'recommendations': [],
                'message': 'No embeddings found for user history'
            })
        
        # Calculate average embedding (user profile)
        user_embeddings = [art['clip_embedding'] for art in interacted_artworks]
        user_profile_embedding = np.mean(user_embeddings, axis=0).tolist()
        
        logger.info(f"User profile based on {len(interacted_artworks)} artworks")
        
        # Get all artworks excluding already interacted ones
        all_artworks = list(db.artworks.find({
            '_id': {'$nin': [ObjectId(aid) for aid in interaction_ids]},
            'clip_embedding': {'$exists': True}
        }))
        
        if not all_artworks:
            return jsonify({
                'success': True,
                'user_id': user_id,
                'based_on_items': len(interacted_artworks),
                'recommendations': [],
                'message': 'No new artworks to recommend'
            })
        
        # Calculate similarities
        similarities = []
        for artwork in all_artworks:
            similarity = cosine_similarity(user_profile_embedding, artwork['clip_embedding'])
            similarities.append({
                'artwork_id': str(artwork['_id']),
                'similarity': float(similarity),
                'title': artwork.get('title', 'Untitled'),
                'artist_id': str(artwork.get('artist', 'Unknown')) if artwork.get('artist') else 'Unknown',
                'image': artwork.get('image', ''),
                'price': artwork.get('price', 0)
            })
        
        # Sort by similarity and get top K
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        recommendations = similarities[:top_k]
        
        logger.info(f"✓ Generated {len(recommendations)} personalized recommendations")
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'based_on_items': len(interacted_artworks),
            'recommendations': recommendations,
            'total_compared': len(similarities)
        })
        
    except Exception as e:
        logger.error(f"Error in recommend_personalized: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/batch-generate-embeddings', methods=['POST'])
def batch_generate_embeddings():
    """
    Generate embeddings for multiple artworks in batch
    
    Request body:
        {
            "force_regenerate": false,  // optional
            "limit": 100  // optional
        }
    
    Returns:
        JSON with processing results
    """
    try:
        data = request.json or {}
        force_regenerate = data.get('force_regenerate', False)
        limit = data.get('limit', 100)
        
        logger.info(f"Batch processing: force_regenerate={force_regenerate}, limit={limit}")
        
        # Get artworks without embeddings or all if force_regenerate
        if force_regenerate:
            query = {}
        else:
            query = {'clip_embedding': {'$exists': False}}
        
        artworks = list(db.artworks.find(query).limit(limit))
        
        if not artworks:
            return jsonify({
                'success': True,
                'message': 'No artworks to process',
                'processed': 0,
                'failed': 0,
                'total': 0
            })
        
        logger.info(f"Processing {len(artworks)} artworks...")
        
        processed = 0
        failed = 0
        
        for i, artwork in enumerate(artworks, 1):
            try:
                artwork_id = artwork['_id']
                image_url = artwork.get('image')
                
                if not image_url:
                    logger.warning(f"Artwork {artwork_id} has no image_url")
                    failed += 1
                    continue
                
                # Load image
                image = load_image_from_url(image_url)
                if image is None:
                    logger.warning(f"Failed to load image for artwork {artwork_id}")
                    failed += 1
                    continue
                
                # Generate embedding
                embedding = get_image_embedding(image)
                if embedding is None:
                    logger.warning(f"Failed to generate embedding for artwork {artwork_id}")
                    failed += 1
                    continue
                
                # Update database
                db.artworks.update_one(
                    {'_id': artwork_id},
                    {
                        '$set': {
                            'embedding': embedding,
                            'embedding_updated_at': datetime.utcnow()
                        }
                    }
                )
                
                processed += 1
                
                if i % 10 == 0:
                    logger.info(f"Progress: {i}/{len(artworks)} artworks processed")
                
            except Exception as e:
                logger.error(f"Error processing artwork {artwork.get('_id')}: {str(e)}")
                failed += 1
        
        logger.info(f"✓ Batch processing complete: {processed} successful, {failed} failed")
        
        return jsonify({
            'success': True,
            'processed': processed,
            'failed': failed,
            'total': len(artworks)
        })
        
    except Exception as e:
        logger.error(f"Error in batch_generate_embeddings: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================================
# INITIALIZATION (runs on import for gunicorn/Railway)
# ============================================================================

# Initialize services asynchronously to avoid blocking startup
import threading
import time

def async_initialize():
    """Initialize services in background thread"""
    try:
        logger.info("Starting async initialization...")
        time.sleep(2)  # Give server time to start
        initialize_model()
        initialize_database()
        logger.info("✓ Services initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize services: {str(e)}")

# Start initialization in background
init_thread = threading.Thread(target=async_initialize, daemon=True)
init_thread.start()

# ============================================================================
# SERVER STARTUP
# ============================================================================

if __name__ == '__main__':
    try:
        # Initialize services
        initialize_model()
        initialize_database()
        
        # Start server
        logger.info("=" * 50)
        logger.info(f"Starting Artscape Recommendation Service")
        logger.info(f"Port: {Config.PORT}")
        logger.info(f"Model: {Config.MODEL_NAME}")
        logger.info(f"Device: {device}")
        logger.info("=" * 50)
        
        app.run(
            host='0.0.0.0',
            port=Config.PORT,
            debug=False
        )
        
    except Exception as e:
        logger.error(f"Failed to start service: {str(e)}")
        raise