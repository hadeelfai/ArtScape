// testFeatureExtraction.js
import fs from 'fs';
import path from 'path';
import imageFeatureExtractor from './imageFeatureExtractor.js';
//fully new
(async () => {
  try {
    // Initialize model if not ready
    if (!imageFeatureExtractor.isReady) {
      console.log('Initializing model...');
      await imageFeatureExtractor.initialize();
    }

    console.log('Model ready?', imageFeatureExtractor.isReady);

    // Load test images
    const imagePath1 = path.join(process.cwd(), 'test-image1.jpg'); // place your test images here
    const imagePath2 = path.join(process.cwd(), 'test-image2.jpg');

    const buffer1 = fs.readFileSync(imagePath1);
    const buffer2 = fs.readFileSync(imagePath2);

    // Extract feature vectors
    const features1 = await imageFeatureExtractor.extractFeatures(buffer1);
    const features2 = await imageFeatureExtractor.extractFeatures(buffer2);

    console.log('Feature vector 1 length:', features1.length);
    console.log('Feature vector 2 length:', features2.length);

    // Compute cosine similarity
    const similarity = imageFeatureExtractor.cosineSimilarity(features1, features2);
    console.log('Cosine similarity between images:', similarity); // 0 to 1
  } catch (error) {
    console.error('Error during test:', error);
  }
})();
