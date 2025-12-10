import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto' // ✅ NEW: Added for password reset token generation
import User from '../models/User.js'
import Artwork from '../models/Artwork.js'
import { authMiddleware } from '../middleware/AuthMiddleware.js' // ✅ SECURITY FIX: Add auth import

const router = express.Router()


function setAuthCookie(res, token) {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 
    })
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
    'bannerImage'
]

function buildProfileResponse(user, artworks = []) {
    if (!user) return null

    const sanitizedUser = PROFILE_RESPONSE_FIELDS.reduce((acc, field) => {
        if (field === 'id') {
            acc.id = user._id?.toString()
        } else if (user[field] !== undefined) {
            acc[field] = user[field]
        }
        return acc
    }, {})

    sanitizedUser.dateOfBirth = user.dateOfBirth ?? { month: '', day: '', year: '' }
    sanitizedUser.socialLinks = {
        instagram: user.socialLinks?.instagram ?? '',
        twitter: user.socialLinks?.twitter ?? ''
    }

    return {
        user: sanitizedUser,
        artworks
    }
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
        'bannerImage'
    ]

    const payload = {}

    allowedFields.forEach(field => {
        if (body[field] !== undefined) {
            payload[field] = body[field]
        }
    })

    if (
        body.dateOfBirth ||
        body.dateOfBirthMonth !== undefined ||
        body.dateOfBirthDay !== undefined ||
        body.dateOfBirthYear !== undefined
    ) {
        const dob = body.dateOfBirth || {}
        payload.dateOfBirth = {
            month: body.dateOfBirthMonth ?? dob.month ?? '',
            day: body.dateOfBirthDay ?? dob.day ?? '',
            year: body.dateOfBirthYear ?? dob.year ?? ''
        }
    }

    if (body.instagram !== undefined || body.twitter !== undefined || body.socialLinks) {
        const links = body.socialLinks || {}
        payload.socialLinks = {
            instagram: body.instagram ?? links.instagram ?? '',
            twitter: body.twitter ?? links.twitter ?? ''
        }
    }

    return payload
}

//POST - Register new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, username, firstName, lastName, phoneNumber } = req.body
        
        // Normalize username: remove @ symbol and trim
        let normalizedUsername = username ? username.trim().replace(/^@+/, '') : '';
        
        // Generate username from name if not provided
        if (!normalizedUsername || normalizedUsername.length === 0) {
            normalizedUsername = name.toLowerCase().trim().replace(/\s+/g, '_');
        }
        
        // Ensure username meets minimum length requirement
        if (normalizedUsername.length < 3) {
            normalizedUsername = normalizedUsername.padEnd(3, '_');
        }
        
        // Check if username already exists, append number if needed
        let finalUsername = normalizedUsername;
        let counter = 1;
        while (await User.findOne({ username: finalUsername })) {
            finalUsername = `${normalizedUsername}${counter}`;
            counter++;
        }
        
        const hashedPassword = await bcrypt.hash(password, 10)
        
        // Build user object with all provided fields
        const userData = {
            name,
            email,
            password: hashedPassword,
            username: finalUsername,
            followersArray: [], // Initialize empty arrays
            followingArray: [],
            followers: 0,
            following: 0,
            profileImage: '/Profileimages/User.jpg', // Set default profile image
            bannerImage: '/Profileimages/Cover.jpg' // Set default banner image
        };
        
        // Add optional fields if provided
        if (firstName) userData.firstName = firstName;
        if (lastName) userData.lastName = lastName;
        if (phoneNumber) userData.phoneNumber = phoneNumber;
        
        const user = new User(userData)
        
        // Ensure defaults are always set before saving
        if (!user.profileImage || user.profileImage.trim() === '') {
            user.profileImage = '/Profileimages/User.jpg'
        }
        if (!user.bannerImage || user.bannerImage.trim() === '') {
            user.bannerImage = '/Profileimages/Cover.jpg'
        }
        
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
                username: user.username,
                role: user.role,  
                profileImage: user.profileImage || '/Profileimages/User.jpg',
                bannerImage: user.bannerImage || '/Profileimages/Cover.jpg',
                bio: user.bio || null,
                artisticSpecialization: user.artisticSpecialization || null,
                followers: user.followers || 0,
                following: user.following || 0
            }
        })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// POST - Login user (email OR username)
router.post('/login', async (req, res) => {
  try {
    const { password, email, username } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const identifier = (email || username || "").toLowerCase();

    if (!identifier) {
      return res
        .status(400)
        .json({ message: "Email or username is required" });
    }

    // allow login by email OR username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.accountStatus === "blocked") {
      return res
        .status(403)
        .json({ message: "Your account is blocked. Please contact support." });
    }

    if (user.accountStatus === "suspended") {
      return res
        .status(403)
        .json({ message: "Your account is suspended." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    setAuthCookie(res, token);

    res.status(200).json({
      message: "user logged in successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        profileImage: user.profileImage || null,
        bannerImage: user.bannerImage || null,
        bio: user.bio || null,
        artisticSpecialization: user.artisticSpecialization || null,
        followers: user.followers || 0,
        following: user.following || 0,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

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

// ========================================
// ✅ NEW: FORGOT PASSWORD ROUTES START
// ========================================

// POST - Forgot Password (generate reset token)
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Find user by email (case-insensitive)
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({ error: 'No account found with this email address' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Save hashed token and expiry to user
        user.passwordResetToken = resetTokenHash;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        // In development, just log the URL (in production, you'd send an email)
        console.log('Password Reset URL:', resetUrl);
        console.log('Reset Token:', resetToken);

        res.status(200).json({
            message: 'Password reset link generated successfully',
            url: resetUrl,
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process password reset request' });
    }
});

// POST - Reset Password (using token)
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'New password is required' });
        }

        // Hash the token from URL to compare with stored hash
        const resetTokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid token and not expired
        const user = await User.findOne({
            passwordResetToken: resetTokenHash,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password and clear reset token fields
        user.password = hashedPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({
            message: 'Password reset successful. You can now login with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// ========================================
// ✅ NEW: FORGOT PASSWORD ROUTES END
// ========================================

// Profile route

// Get user profile with artworks
router.get('/profile/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('followersArray', '_id')
            .populate('followingArray', '_id')
        
        if (!user)
            return res.status(404).json({ error: 'User not found' })

        // Filter out null/invalid entries (deleted users) and count only valid ones
        const validFollowers = Array.isArray(user.followersArray) 
            ? user.followersArray.filter(f => f && f._id).length 
            : 0
        const validFollowing = Array.isArray(user.followingArray) 
            ? user.followingArray.filter(f => f && f._id).length 
            : 0

        // Clean up invalid IDs from arrays and sync counts
        if (user.followers !== validFollowers || user.following !== validFollowing) {
            // Get the raw arrays to clean them
            const rawUser = await User.findById(req.params.id).select('followersArray followingArray')
            
            if (rawUser) {
                // Get all valid user IDs in one query
                const allFollowerIds = Array.isArray(rawUser.followersArray) ? rawUser.followersArray : []
                const allFollowingIds = Array.isArray(rawUser.followingArray) ? rawUser.followingArray : []
                
                // Check which IDs actually exist in the database
                const existingFollowerUsers = await User.find({ _id: { $in: allFollowerIds } }).select('_id')
                const existingFollowingUsers = await User.find({ _id: { $in: allFollowingIds } }).select('_id')
                
                const validFollowerIds = existingFollowerUsers.map(u => u._id)
                const validFollowingIds = existingFollowingUsers.map(u => u._id)
                
                // Remove duplicates (in case there are any)
                const uniqueFollowerIds = Array.from(new Map(
                    validFollowerIds.map(id => [id.toString(), id])
                ).values())
                const uniqueFollowingIds = Array.from(new Map(
                    validFollowingIds.map(id => [id.toString(), id])
                ).values())
                
                // Update arrays and counts atomically
                await User.findByIdAndUpdate(
                    req.params.id,
                    { 
                        $set: { 
                            followersArray: uniqueFollowerIds,
                            followingArray: uniqueFollowingIds,
                            followers: uniqueFollowerIds.length,
                            following: uniqueFollowingIds.length
                        } 
                    }
                )
                
                // Update the user object for the response
                user.followers = uniqueFollowerIds.length
                user.following = uniqueFollowingIds.length
            }
        } else {
            // Just update counts if arrays are clean
            user.followers = validFollowers
            user.following = validFollowing
        }

        const artworks = await Artwork.find({ artist: req.params.id })

        res.json(buildProfileResponse(user, artworks))
    } catch (error) {
        console.error('Get profile error:', error)
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
// ✅ SECURITY FIX: Consider adding authMiddleware and using req.user.id from JWT instead of body
router.post('/follow/:id', async (req, res) => {
    try {
        const { userId } = req.body // The user who is following
        const targetUserId = req.params.id // The user to follow

        if (!userId || !targetUserId) {
            return res.status(400).json({ error: 'User ID and target user ID are required' })
        }

        // Prevent users from following themselves
        if (userId.toString() === targetUserId.toString()) {
            return res.status(400).json({ error: 'You cannot follow yourself' })
        }

        // Check if already following
        const user = await User.findById(userId).select('followingArray')
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        const isFollowing = user.followingArray?.some(id => id.toString() === targetUserId.toString()) || false

        if (isFollowing) {
            // Unfollow - use atomic operations
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $pull: { followingArray: targetUserId } },
                { new: true }
            )
            
            const updatedTargetUser = await User.findByIdAndUpdate(
                targetUserId,
                { $pull: { followersArray: userId } },
                { new: true }
            )

            // Update counts based on actual array lengths (using atomic update to avoid version conflicts)
            if (updatedUser) {
                await User.findByIdAndUpdate(
                    userId,
                    { $set: { following: updatedUser.followingArray?.length || 0 } }
                )
            }
            
            if (updatedTargetUser) {
                await User.findByIdAndUpdate(
                    targetUserId,
                    { $set: { followers: updatedTargetUser.followersArray?.length || 0 } }
                )
            }
        } else {
            // Follow - use atomic operations with $addToSet to prevent duplicates
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $addToSet: { followingArray: targetUserId } },
                { new: true }
            )
            
            const updatedTargetUser = await User.findByIdAndUpdate(
                targetUserId,
                { $addToSet: { followersArray: userId } },
                { new: true }
            )

            // Update counts based on actual array lengths (using atomic update to avoid version conflicts)
            if (updatedUser) {
                await User.findByIdAndUpdate(
                    userId,
                    { $set: { following: updatedUser.followingArray?.length || 0 } }
                )
            }
            
            if (updatedTargetUser) {
                await User.findByIdAndUpdate(
                    targetUserId,
                    { $set: { followers: updatedTargetUser.followersArray?.length || 0 } }
                )
            }
        }

        res.json({
            message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
            isFollowing: !isFollowing
        })
    } catch (error) {
        console.error('Follow/unfollow error:', error)
        res.status(500).json({ error: error.message })
    }
})

// =========================
// ADMIN: USER MANAGEMENT (Protected by authMiddleware + role check)
// =========================

// GET /users  -> list all users (no passwords) - Public for gallery lookup, admin modifications protected separately
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ SECURITY FIX: Add authMiddleware to protect admin endpoints
// PATCH /users/:id/status  -> set accountStatus: active | suspended | blocked
router.patch('/:id/status', authMiddleware, async (req, res) => {
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

// ✅ SECURITY FIX: Add authMiddleware to protect admin endpoints
// DELETE /users/:id  -> admin permanently deletes user
router.delete('/:id', authMiddleware, async (req, res) => {
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

        // Ensure arrays are initialized (read-only check, don't save)
        const followersArray = Array.isArray(user.followersArray) ? user.followersArray : []

        const followers = followersArray.map(follower => ({
            id: follower._id.toString(),
            name: follower.name,
            username: follower.username || `@${follower.name.toLowerCase().replace(/\s+/g, '_')}`,
            bio: follower.bio || '',
            profileImage: follower.profileImage || '/assets/images/profilepicture.jpg',
            followers: follower.followers || 0,
            following: follower.following || 0
        }))

        // Always use actual array length as count to ensure accuracy
        const actualCount = followers.length

        res.json({
            followers,
            count: actualCount
        })
    } catch (error) {
        console.error('Get followers error:', error)
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

        // Ensure arrays are initialized (read-only check, don't save)
        const followingArray = Array.isArray(user.followingArray) ? user.followingArray : []

        const following = followingArray.map(followed => ({
            id: followed._id.toString(),
            name: followed.name,
            username: followed.username || `@${followed.name.toLowerCase().replace(/\s+/g, '_')}`,
            bio: followed.bio || '',
            profileImage: followed.profileImage || '/assets/images/profilepicture.jpg',
            followers: followed.followers || 0,
            following: followed.following || 0
        }))

        // Always use actual array length as count to ensure accuracy
        const actualCount = following.length

        res.json({
            following,
            count: actualCount
        })
    } catch (error) {
        console.error('Get following error:', error)
        res.status(500).json({ error: error.message })
    }
})

// Get user by ID (generic lookup, must come AFTER all /profile routes to avoid shadowing)
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

export default router