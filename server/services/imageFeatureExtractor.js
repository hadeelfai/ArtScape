import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import sharp from 'sharp';
//fully new
class ImageFeatureExtractor {
  constructor() {
    this.model = null;
    this.isReady = false;
  }

  // Initialize once when server starts
  async initialize() {
    if (this.isReady) return;
    
    try {
      console.log('Loading MobileNet model...');
      
      // This downloads and loads the pre-trained model
      // First time: ~10MB download, takes ~30 seconds
      // After that: loads from cache instantly
      this.model = await mobilenet.load({
        version: 2,
        alpha: 1.0, // Use full model (best accuracy)
      });
      
      this.isReady = true;
      console.log('MobileNet model ready!');
    } catch (error) {
      console.error('Error loading MobileNet:', error);
      throw error;
    }
  }

  // Extract feature vector from image buffer
  async extractFeatures(imageBuffer) {
    if (!this.isReady) {
      await this.initialize();
    }

    try {
      // 1. Decode image to tensor
      const imageTensor = tf.node.decodeImage(imageBuffer, 3);
      
      // 2. Resize to 224x224 (MobileNet's input size)
      const resized = tf.image.resizeBilinear(imageTensor, [224, 224]);
      
      // 3. Normalize pixel values to [-1, 1]
      const normalized = resized.toFloat().div(127.5).sub(1);
      
      // 4. Add batch dimension [1, 224, 224, 3]
      const batched = normalized.expandDims(0);
      
      // 5. Get embeddings (1280-dimensional feature vector)
      // This is the magic - MobileNet extracts learned features!
      const embeddings = this.model.infer(batched, true);
      
      // 6. Convert to JavaScript array
      const embeddingsArray = await embeddings.array();
      const featureVector = embeddingsArray[0];
      
      // 7. Clean up tensors to prevent memory leaks
      imageTensor.dispose();
      resized.dispose();
      normalized.dispose();
      batched.dispose();
      embeddings.dispose();
      
      return featureVector;
      
    } catch (error) {
      console.error('Error extracting features:', error);
      return null;
    }
  }

  // Process image: resize, compress, extract features
  async processUpload(imageBuffer) {
    try {
      // 1. Create optimized version for storage
      const optimized = await sharp(imageBuffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      // 2. Create thumbnail
      const thumbnail = await sharp(imageBuffer)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();

      // 3. Extract color palette
      const metadata = await sharp(imageBuffer).stats();
      const dominantColors = this.extractDominantColors(metadata);

      // 4. Extract feature vector for recommendations
      const featureVector = await this.extractFeatures(imageBuffer);

      return {
        optimized,
        thumbnail,
        dominantColors,
        featureVector,
        success: true
      };

    } catch (error) {
      console.error('Error processing image:', error);
      return { success: false, error: error.message };
    }
  }

  // Extract dominant colors from image
  extractDominantColors(stats) {
    const { channels } = stats;
    
    return [
      {
        hex: this.rgbToHex(channels[0].mean, channels[1].mean, channels[2].mean),
        rgb: {
          r: Math.round(channels[0].mean),
          g: Math.round(channels[1].mean),
          b: Math.round(channels[2].mean)
        }
      }
    ];
  }

  rgbToHex(r, g, b) {
    return "#" + [r, g, b]
      .map(x => Math.round(x).toString(16).padStart(2, '0'))
      .join('');
  }

  // Calculate cosine similarity between two feature vectors
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }
    
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

// Export singleton instance
const extractor = new ImageFeatureExtractor();
export default extractor;