/**
 * Script to populate sample user interaction data
 * This helps test personalized recommendations
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Artwork from '../models/Artwork.js';

dotenv.config();

const sampleInteractions = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URL);
        
        console.log('Getting users and artworks...');
        const users = await User.find({}).limit(10);
        const artworks = await Artwork.find({}).limit(30);
        
        if (users.length === 0 || artworks.length === 0) {
            console.log('No users or artworks found');
            return;
        }
        
        console.log(`Found ${users.length} users and ${artworks.length} artworks`);
        
        // Generate random interactions for each user
        for (const user of users) {
            const likedArtworks = [];
            const savedArtworks = [];
            const viewedArtworks = [];
            const cartAdditions = [];
            
            // Random interactions
            const likeCount = Math.floor(Math.random() * 6) + 3;
            const saveCount = Math.floor(Math.random() * 5) + 2;
            const viewCount = Math.floor(Math.random() * 11) + 5;
            const cartCount = Math.floor(Math.random() * 4) + 1;
            
            // Generate unique random artworks
            for (let i = 0; i < likeCount && i < artworks.length; i++) {
                const randomArtwork = artworks[Math.floor(Math.random() * artworks.length)];
                if (!likedArtworks.includes(randomArtwork._id)) {
                    likedArtworks.push(randomArtwork._id);
                }
            }
            
            for (let i = 0; i < saveCount && i < artworks.length; i++) {
                const randomArtwork = artworks[Math.floor(Math.random() * artworks.length)];
                if (!savedArtworks.includes(randomArtwork._id)) {
                    savedArtworks.push(randomArtwork._id);
                }
            }
            
            for (let i = 0; i < viewCount && i < artworks.length; i++) {
                const randomArtwork = artworks[Math.floor(Math.random() * artworks.length)];
                viewedArtworks.push({
                    artwork: randomArtwork._id,
                    durationSeconds: Math.floor(Math.random() * 300) + 10,
                    viewedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
                });
            }
            
            for (let i = 0; i < cartCount && i < artworks.length; i++) {
                const randomArtwork = artworks[Math.floor(Math.random() * artworks.length)];
                if (!cartAdditions.includes(randomArtwork._id)) {
                    cartAdditions.push(randomArtwork._id);
                }
            }
            
            // Update user
            await User.findByIdAndUpdate(user._id, {
                likedArtworks,
                savedArtworks,
                viewedArtworks,
                cartAdditions
            });
            
            console.log(`${user.username}: likes=${likedArtworks.length}, saved=${savedArtworks.length}, viewed=${viewedArtworks.length}, cart=${cartAdditions.length}`);
        }
        
        console.log('\nSample interaction data created successfully.');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

sampleInteractions();
