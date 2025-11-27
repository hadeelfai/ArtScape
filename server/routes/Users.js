import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import Artwork from '../models/Artwork.js'

const router = express.Router()
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'
//import { authMiddleware } from '../middleware/AuthMiddleware.js'

function setAuthCookie(res, token) {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 //1 week
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
        stats: {
            totalArtworks: artworks.length,
            totalFollowers: user.followers || 0,
            totalFollowing: user.following || 0
        },
        artworks: artworks.map(art => ({
            id: art._id?.toString(),
            _id: art._id?.toString(),
            title: art.title || '',
            description: art.description || '',
            image: art.image,  // Keep the image field as-is - don't convert to undefined
            tags: art.tags || '',
            dimensions: art.dimensions || '',
            year: art.year || '',
            artworkType: art.artworkType || 'Explore',
            price: art.price || null,
            createdAt: art.createdAt
        }))
    }
}

function buildProfileUpdatePayload(body) {
    const updatableFields = [
        'name',
        'firstName',
        'lastName',
        'email',
        'phoneNumber',
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
        'dateOfBirth',
        'socialLinks'
    ]

    const updateData = {}
    for (const field of updatableFields) {
        if (body[field] !== undefined) {
            updateData[field] = body[field]
        }
    }

    if (!updateData.dateOfBirth) {
        updateData.dateOfBirth = {
            month: body.month || '',
            day: body.day || '',
            year: body.year || ''
        }
    }

    updateData.socialLinks = {
        instagram: body.instagram || '',
        twitter: body.twitter || ''
    }

    return updateData
}

// Create new user
router.post('/register', async (req, res) => {
    try {
        const { password, email } = req.body

        if (!password || !email) {
            return res.status(400).json({ message: 'Email and password are required' })
        }

        const existUser = await User.findOne({ email })

        if (existUser) {
            return res.status(400).json({ message: 'This email is already used' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const userData = {
            ...req.body,
            password: hashedPassword,
            username: req.body.username || `@${req.body.name?.toLowerCase().replace(/\s+/g, '_') || 'user'}`,
            dateOfBirth: {
                month: req.body.month || '',
                day: req.body.day || '',
                year: req.body.year || ''
            },
            socialLinks: {
                instagram: req.body.instagram || '',
                twitter: req.body.twitter || ''
            },
            followers: 0,
            following: 0
        }

        const user = await User.create(userData)

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        })

        setAuthCookie(res, token)

        res.status(201).json({
            message: 'user created successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                username: user.username
            }
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/login', async (req, res) => {
    try {
        const { password, email } = req.body
        const user = await User.findOne({ email })
        if (!user) return res.status(404).json({ message: "user not found" })
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) return res.status(400).json({ message: 'invalid password' })

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        })

        setAuthCookie(res, token)

        res.status(201).json({
            message: 'user logged in successfully',
            token, user: { id: user._id, name: user.name, email: user.email }
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Forgot Password - request reset link
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User with this email not found' });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const resetUrl = `${CLIENT_URL}/reset-password/${token}`;

        // TODO: هنا لاحقًا تفعّلين إرسال الإيميل وتستخدمين resetUrl
        console.log('Password reset URL:', resetUrl);

        return res.json({
            message: 'Password reset link generated successfully',
            url: resetUrl
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Reset Password - update password using token
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({
                message: 'Invalid or expired reset link'
            });
        }

        const user = await User.findById(payload.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();

        return res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Get user by id (basic)
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
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('followersArray', '_id')
            .populate('followingArray', '_id')
        
        if (!user)
            return res.status(404).json({ error: 'User not found' })

        const artworks = await Artwork.find({ artist: req.params.id })

        // Calculate actual counts after filtering out deleted users
        const actualFollowersCount = user.followersArray.filter(f => f && f._id).length
        const actualFollowingCount = user.followingArray.filter(f => f && f._id).length

        // Update the user object with actual counts for buildProfileResponse
        user.followers = actualFollowersCount
        user.following = actualFollowingCount

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

// Delete user profile
router.delete('/profile/:id', async (req, res) => {
    try {
        const userId = req.params.id
        const { password } = req.body

        if (!password) {
            return res.status(400).json({ error: 'Password is required to delete account' })
        }

        const user = await User.findById(userId)

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password. Please check your password and try again.' })
        }

        // Delete all artworks by this user
        await Artwork.deleteMany({ artist: userId })

        // Remove this user from all followers' following lists
        await User.updateMany(
            { followersArray: userId },
            { 
                $pull: { followersArray: userId },
                $inc: { followers: -1 }
            }
        )

        // Remove this user from all following's followers lists
        await User.updateMany(
            { followersArray: { $in: user.followingArray } },
            {
                $inc: { followers: -1 }
            }
        )

        // Delete the user
        await User.findByIdAndDelete(userId)

        res.json({ message: 'Account deleted successfully' })
    } catch (error) {
        console.error('Error deleting user:', error)
        res.status(500).json({ error: error.message || 'Failed to delete account' })
    }
})

// Follow/Unfollow user
router.post('/follow/:id', async (req, res) => {
    try {
        const userId = req.body.userId
        const targetUserId = req.params.id

        if (userId === targetUserId) {
            return res.status(400).json({ error: 'You cannot follow yourself' })
        }

        const user = await User.findById(userId)
        const targetUser = await User.findById(targetUserId)

        if (!user || !targetUser) {
            return res.status(404).json({ error: 'User not found' })
        }

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
            message: isFollowing ? 'User unfollowed successfully' : 'User followed successfully',
            following: user.following,
            followers: targetUser.followers
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get followers
router.get('/:id/followers', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('followersArray', 'name username bio profileImage followers following')

        if (!user)
            return res.status(404).json({ error: 'User not found' })

        // Filter out null/undefined followers (deleted users) and map to response format
        const followers = user.followersArray
            .filter(follower => follower && follower._id) // Remove null/undefined entries
            .map(follower => ({
                id: follower._id.toString(),
                name: follower.name,
                username: follower.username || `@${follower.name.toLowerCase().replace(/\s+/g, '_')}`,
                bio: follower.bio || '',
                profileImage: follower.profileImage || '/assets/images/profilepicture.jpg',
                followers: follower.followers || 0,
                following: follower.following || 0
            }))

        // Use the actual filtered array length instead of the stored count
        // This ensures the count matches what's actually displayed
        const actualCount = followers.length

        res.json({
            followers,
            count: actualCount
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get following
router.get('/:id/following', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('followingArray', 'name username bio profileImage followers following')

        if (!user)
            return res.status(404).json({ error: 'User not found' })

        // Filter out null/undefined following (deleted users) and map to response format
        const following = user.followingArray
            .filter(followed => followed && followed._id) // Remove null/undefined entries
            .map(followed => ({
                id: followed._id.toString(),
                name: followed.name,
                username: followed.username || `@${followed.name.toLowerCase().replace(/\s+/g, '_')}`,
                bio: followed.bio || '',
                profileImage: followed.profileImage || '/assets/images/profilepicture.jpg',
                followers: followed.followers || 0,
                following: followed.following || 0
            }))

        // Use the actual filtered array length instead of the stored count
        // This ensures the count matches what's actually displayed
        const actualCount = following.length

        res.json({
            following,
            count: actualCount
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
