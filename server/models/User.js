import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // PASSWORD RESET FIELDS    
    passwordResetToken: {
      type: String,
      default: undefined,
    },

    passwordResetExpires: {
      type: Date,
      default: undefined,
    },
    //  END OF PASSWORD RESET FIELDS

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'blocked'],
      default: 'active',
    },

    avatar: {
      type: String,
    },

    // ---- PROFILE FIELDS ----
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    firstName: String,
    lastName: String,
    phoneNumber: String,
    address: String,
    state: String,
    country: String,
    city: String,
    zipCode: String,

    dateOfBirth: {
      month: String,
      day: String,
      year: String,
    },

    gender: String,
    artisticSpecialization: String,
    bio: String,

    profileImage: {
      type: String,
      default: '/assets/images/profilepicture.jpg',
    },

    bannerImage: {
      type: String,
      default: '/assets/images/profileheader.jpg',
    },

    socialLinks: {
      instagram: {
        type: String,
        default: '',
      },
      twitter: {
        type: String,
        default: '',
      },
    },

    followers: {
      type: Number,
      default: 0,
    },

    following: {
      type: Number,
      default: 0,
    },

    followersArray: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    followingArray: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    likedArtworks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artwork'
    }],
    savedArtworks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artwork'
    }],
    purchasedArtworks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artwork'
    }],
    // Recommendation data: view history (artworkId, duration in seconds, timestamp)
    viewedArtworks: [{
      artwork: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork' },
      durationSeconds: Number,
      viewedAt: { type: Date, default: Date.now }
    }],
    // Cart additions (purchase intent) - artwork IDs user added to cart
    cartAdditions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artwork' }],
    // Search queries for explicit preference
    searchHistory: [{ query: String, searchedAt: { type: Date, default: Date.now } }],
    // Category/tab clicks (Explore, Marketplace, filters)
    browsingPreferences: {
      exploreClicks: { type: Number, default: 0 },
      marketplaceClicks: { type: Number, default: 0 },
      filterUsage: mongoose.Schema.Types.Mixed // e.g. { size: 3, color: 2, artType: 5 }
    }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);