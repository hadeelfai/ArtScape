import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Artwork from '../models/Artwork.js'

const router = express.Router()
import bcrypt from 'bcryptjs'
//import { authMiddleware } from '../middleware/AuthMiddleware.js'



function setAuthCookie(res, token) {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "prodution",
        sameSite: process.env.NODE_ENV === "prodution" ? "none " : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 //1 week
    })
}
//post a new
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body
        const hashedPassword = await bcrypt.hash(password, 10)
        const user = new User({ name, email, password: hashedPassword })
        await user.save()

        const token = jwt.sign({ is: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        })

        setAuthCookie(res, token)

        res.status(201).json({
            message: 'user registered successfully', token, user: {
                id: user._id, name: user.name,
                email: user.email
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

        const token = jwt.sign({ is: user._id }, process.env.JWT_SECRET, {
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

        res.json({
            user: {
                name: user.name,
                artisticSpecialization: user.artisticSpecialization,
                bio: user.bio,
                followers: user.followers,
                following: user.following,
                profileImage: user.profileImage,
                bannerImage: user.bannerImage
            },
            artworks
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Update user profile
router.put('/profile/:id', async (req, res) => {
    try {
        const userId = req.params.id
        const updateData = req.body

        // Don't allow password update through this route
        delete updateData.password

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password')

        if (!updatedUser)
            return res.status(404).json({ error: 'User not found' })

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        })
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

export default router
