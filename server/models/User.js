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
      required: true,     // ✔️ username إلزامي
      unique: true,       // ✔️ يمنع التكرار في الداتابيس
      lowercase: true,    // ✔️ يحفظه بحروف صغيرة
      trim: true,         // ✔️ يشيل المسافات
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
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
