import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Artwork from '../models/Artwork.js';

const router = express.Router();
// import { authMiddleware } from '../middleware/AuthMiddleware.js'

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
  });
}

const PROFILE_RESPONSE_FIELDS = [
  'id',
  'name',
  'email',
  'username',
  'firstName',
  'lastName',
  'phoneNumber',
  'address',
  'state',
  'country',
  'city',
  'zipCode',
  'gender',
  'artisticSpecialization',
  'bio',
  'followers',
  'following',
  'profileImage',
  'bannerImage',
];

function buildProfileResponse(user, artworks = []) {
  if (!user) return null;

  const sanitizedUser = PROFILE_RESPONSE_FIELDS.reduce((acc, field) => {
    if (field === 'id') {
      acc.id = user._id?.toString();
    } else if (user[field] !== undefined) {
      acc[field] = user[field];
    }
    return acc;
  }, {});

  sanitizedUser.dateOfBirth = user.dateOfBirth ?? { month: '', day: '', year: '' };
  sanitizedUser.socialLinks = {
    instagram: user.socialLinks?.instagram ?? '',
    twitter: user.socialLinks?.twitter ?? '',
  };

  return {
    user: sanitizedUser,
    artworks,
  };
}

function buildProfileUpdatePayload(body) {
  const allowedFields = [
    'name',
    'username',
    'firstName',
    'lastName',
    'phoneNumber',
    'email',
    'address',
    'state',
    'country',
    'city',
    'zipCode',
    'gender',
    'artisticSpecialization',
    'bio',
    'profileImage',
    'bannerImage',
  ];

  const payload = {};

  allowedFields.forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  });

  if (
    body.dateOfBirth ||
    body.dateOfBirthMonth !== undefined ||
    body.dateOfBirthDay !== undefined ||
    body.dateOfBirthYear !== undefined
  ) {
    const dob = body.dateOfBirth || {};
    payload.dateOfBirth = {
      month: body.dateOfBirthMonth ?? dob.month ?? '',
      day: body.dateOfBirthDay ?? dob.day ?? '',
      year: body.dateOfBirthYear ?? dob.year ?? '',
    };
  }

  if (body.instagram !== undefined || body.twitter !== undefined || body.socialLinks) {
    const links = body.socialLinks || {};
    payload.socialLinks = {
      instagram: body.instagram ?? links.instagram ?? '',
      twitter: body.twitter ?? links.twitter ?? '',
    };
  }

  // لو بيحدّث اليوزرنيم نخليه lowercase
  if (payload.username) {
    payload.username = payload.username.trim().toLowerCase();
  }

  return payload;
}

// =================== REGISTER (SIGNUP) ===================
router.post('/register', async (req, res) => {

    try {
        const { name, email, password } = req.body
        const hashedPassword = await bcrypt.hash(password, 10)
        const user = new User({ name, email, password: hashedPassword })
        await user.save()

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        })

        setAuthCookie(res, token)

        res.status(201).json({
            message: 'user registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,  
                profileImage: user.profileImage || null, // ✅ Added
                bannerImage: user.bannerImage || null, // ✅ Added
                bio: user.bio || null, // ✅ Added
                artisticSpecialization: user.artisticSpecialization || null, // ✅ Added
                followers: user.followers || 0, // ✅ Added
                following: user.following || 0 // ✅ Added
            }
        })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// POST - Login user
router.post('/login', async (req, res) => {
    try {
        const { password, email } = req.body
        const user = await User.findOne({ email })
        if (!user) return res.status(404).json({ message: "user not found" })
            //Blocked and suspended users cannot log in
        if (user.accountStatus === "blocked") {
            return res.status(403).json({ message: "Your account is blocked. Please contact support." });
        }
        if (user.accountStatus === "suspended") {
            return res.status(403).json({ message: "Your account is suspended." });
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) return res.status(400).json({ message: 'invalid password' })

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        })

        setAuthCookie(res, token)

        res.status(200).json({
            message: 'user logged in successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,    
                profileImage: user.profileImage || null, // ✅ Added
                bannerImage: user.bannerImage || null, // ✅ Added
                bio: user.bio || null, // ✅ Added
                artisticSpecialization: user.artisticSpecialization || null, // ✅ Added
                followers: user.followers || 0, // ✅ Added
                following: user.following || 0 // ✅ Added
            }
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// POST - Logout user
router.post('/logout', (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        })
        res.status(200).json({ message: 'user logged out successfully' })
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to log out' })
    }
})


router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password')
        if (!user)
            return res.status(404).json({ error: 'user not found' })
        res.json(user)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Profile route

// Get user profile with artworks
router.get('/profile/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password')
        if (!user)
            return res.status(404).json({ error: 'User not found' })

        const artworks = await Artwork.find({ artist: req.params.id })

        res.json(buildProfileResponse(user, artworks))
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Update user profile
router.put('/profile/:id', async (req, res) => {
    try {
        const userId = req.params.id
        const updateData = buildProfileUpdatePayload(req.body)

        // Don't allow password update through this route
        delete updateData.password

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password')

        if (!updatedUser)
            return res.status(404).json({ error: 'User not found' })

        const artworks = await Artwork.find({ artist: userId })

        res.json({
            message: 'Profile updated successfully',
            ...buildProfileResponse(updatedUser, artworks)
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Change user password
router.put('/profile/:id/password', async (req, res) => {
    try {
        const userId = req.params.id
        const { currentPassword, password: newPassword } = req.body

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' })
        }

        // Find user with password field
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        // Validate current password
        const isMatch = await bcrypt.compare(currentPassword, user.password)
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' })
        }

        // Check if new password is different from current
        const isSamePassword = await bcrypt.compare(newPassword, user.password)
        if (isSamePassword) {
            return res.status(400).json({ error: 'New password must be different from current password' })
        }

        // Hash and update password
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword
        await user.save()

        res.json({ message: 'Password changed successfully' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Delete user account
router.delete('/profile/:id', async (req, res) => {
    try {
        const userId = req.params.id
        const { password } = req.body

        if (!password) {
            return res.status(400).json({ error: 'Password is required to delete account' })
        }

        // Find user with password field
        const user = await User.findById(userId)
        if (!user)
            return res.status(404).json({ error: 'User not found' })

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect password' })
        }

        // Delete all artworks by this user
        await Artwork.deleteMany({ artist: userId })

        // Delete the user
        await User.findByIdAndDelete(userId)

        res.json({ message: 'Account deleted successfully' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Follow/Unfollow user
router.post('/follow/:id', async (req, res) => {
    try {
        const { userId } = req.body // The user who is following
        const targetUserId = req.params.id // The user to follow

        const user = await User.findById(userId)
        const targetUser = await User.findById(targetUserId)

        if (!user || !targetUser)
            return res.status(404).json({ error: 'User not found' })

        const isFollowing = user.followingArray.includes(targetUserId)

        if (isFollowing) {
            // Unfollow
            user.followingArray = user.followingArray.filter(id => id.toString() !== targetUserId)
            targetUser.followersArray = targetUser.followersArray.filter(id => id.toString() !== userId)
            user.following -= 1
            targetUser.followers -= 1
        } else {
            // Follow
            user.followingArray.push(targetUserId)
            targetUser.followersArray.push(userId)
            user.following += 1
            targetUser.followers += 1
        }

        await user.save()
        await targetUser.save()

        res.json({
            message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
            isFollowing: !isFollowing
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// =========================
// ADMIN: USER MANAGEMENT
// =========================

// GET /users  -> list all users (no passwords)
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH /users/:id/status  -> set accountStatus: active | suspended | blocked
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        const allowed = ['active', 'suspended', 'blocked'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { accountStatus: status },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: `User account ${status} successfully`,
            user
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /users/:id  -> admin permanently deletes user
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // If you want to mimic "cannot delete with active orders",
        // here you would check for related documents (orders). 
        // For now we just delete artworks + user.
        await Artwork.deleteMany({ artist: userId });
        const deleted = await User.findByIdAndDelete(userId);

        if (!deleted) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User account deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's followers list
router.get('/profile/:id/followers', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('followersArray followers following')
            .populate('followersArray', 'name username bio profileImage followers following')

        if (!user)
            return res.status(404).json({ error: 'User not found' })

        const followers = user.followersArray.map(follower => ({
            id: follower._id.toString(),
            name: follower.name,
            username: follower.username || `@${follower.name.toLowerCase().replace(/\s+/g, '_')}`,
            bio: follower.bio || '',
            profileImage: follower.profileImage || '/assets/images/profilepicture.jpg',
            followers: follower.followers || 0,
            following: follower.following || 0,
            followingArray: user.followingArray || []//for the following tab
        }))

        res.json({
            followers,
            count: user.followers || 0
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get user's following list
router.get('/profile/:id/following', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('followingArray followers following')
            .populate('followingArray', 'name username bio profileImage followers following')

        if (!user)
            return res.status(404).json({ error: 'User not found' })

        const following = user.followingArray.map(followed => ({
            id: followed._id.toString(),
            name: followed.name,
            username: followed.username || `@${followed.name.toLowerCase().replace(/\s+/g, '_')}`,
            bio: followed.bio || '',
            profileImage: followed.profileImage || '/assets/images/profilepicture.jpg',
            followers: followed.followers || 0,
            following: followed.following || 0
        }))

        res.json({
            following,
            count: user.following || 0
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get all users (for gallery)
router.get('/', async (req, res) => {
  try {
    const { name, email, password, username } = req.body;

    // Basic validation
    if (!name || !email || !password || !username) {
      return res.status(400).json({
        message: 'Name, email, password, and username are all required',
      });
    }

    const normalizedUsername = username.trim().toLowerCase();

    // Check username uniqueness
    const existingUsername = await User.findOne({ username: normalizedUsername });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Check email uniqueness
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      username: normalizedUsername,
      password: hashedPassword,
    });

    await user.save();

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    setAuthCookie(res, token);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Register error:', error);

    // Handle duplicate key errors from MongoDB
    if (error.code === 11000 && error.keyPattern) {
      if (error.keyPattern.username) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      if (error.keyPattern.email) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
    }

    res.status(500).json({ error: error.message });
  }
});

// =================== LOGIN ===================
router.post('/login', async (req, res) => {
  try {
    const { password, email } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'user not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'invalid password' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    setAuthCookie(res, token);

    res.status(200).json({
      message: 'user logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =================== GET USER BY ID ===================
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'user not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =================== PROFILE ROUTES ===================

// Get user profile with artworks
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const artworks = await Artwork.find({ artist: req.params.id });

    res.json(buildProfileResponse(user, artworks));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = buildProfileUpdatePayload(req.body);

    // Don't allow password update through this route
    delete updateData.password;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ error: 'User not found' });

    const artworks = await Artwork.find({ artist: userId });

    res.json({
      message: 'Profile updated successfully',
      ...buildProfileResponse(updatedUser, artworks),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Follow/Unfollow user
router.post('/follow/:id', async (req, res) => {
  try {
    const { userId } = req.body; // The user who is following
    const targetUserId = req.params.id; // The user to follow

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) return res.status(404).json({ error: 'User not found' });

    const isFollowing = user.followingArray.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      user.followingArray = user.followingArray.filter(
        (id) => id.toString() !== targetUserId
      );
      targetUser.followersArray = targetUser.followersArray.filter(
        (id) => id.toString() !== userId
      );
      user.following -= 1;
      targetUser.followers -= 1;
    } else {
      // Follow
      user.followingArray.push(targetUserId);
      targetUser.followersArray.push(userId);
      user.following += 1;
      targetUser.followers += 1;
    }

    await user.save();
    await targetUser.save();

    res.json({
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's followers list
router.get('/profile/:id/followers', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('followersArray followers following')
      .populate('followersArray', 'name username bio profileImage followers following');

    if (!user) return res.status(404).json({ error: 'User not found' });

    const followers = user.followersArray.map((follower) => ({
      id: follower._id.toString(),
      name: follower.name,
      username:
        follower.username || `@${follower.name.toLowerCase().replace(/\s+/g, '_')}`,
      bio: follower.bio || '',
      profileImage: follower.profileImage || '/assets/images/profilepicture.jpg',
      followers: follower.followers || 0,
      following: follower.following || 0,
    }));

    res.json({
      followers,
      count: user.followers || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's following list
router.get('/profile/:id/following', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('followingArray followers following')
      .populate('followingArray', 'name username bio profileImage followers following');

    if (!user) return res.status(404).json({ error: 'User not found' });

    const following = user.followingArray.map((followed) => ({
      id: followed._id.toString(),
      name: followed.name,
      username:
        followed.username || `@${followed.name.toLowerCase().replace(/\s+/g, '_')}`,
      bio: followed.bio || '',
      profileImage: followed.profileImage || '/assets/images/profilepicture.jpg',
      followers: followed.followers || 0,
      following: followed.following || 0,
    }));

    res.json({
      following,
      count: user.following || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
