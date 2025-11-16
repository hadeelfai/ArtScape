import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const router = express.Router()
import bcrypt from 'bcryptjs'
//import { authMiddleware } from '../middleware/AuthMiddleware.js'



function setAuthCookie(res,token){
    res.cookie("token", token , {
        httpOnly : true,
        secure: process.env.NODE_ENV === "prodution" ,
        sameSite: process.env.NODE_ENV === "prodution" ? "none " : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 //1 week
    })
}
//post a new
router.post('/register', async (req,res) => {
    try{
        const {name,email,password} = req.body
        const hashedPassword = await bcrypt.hash(password, 10)
        const user = new User({name, email , password:hashedPassword})
        await user.save()

         const token = jwt.sign({is: user._id}, process.env.JWT_SECRET, {
                expiresIn: '7d'
            })

            setAuthCookie(res,token)

        res.status(201).json({message: 'user registered successfully',token, user: {id: user._id, name: user.name, 
            email: user.email}})
    
        }catch (error){
        res.status(500).json({error: error.message})
    }
})

router.post('/login', async (req,res)=>{
    try { 
        const {password ,email} = req.body
        const user = await User.findOne({email})
        if(!user) return res.status(404).json({message: "user not found"})
            const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch) return res.status(400).json({message: 'invalid password'})

        const token = jwt.sign({is: user._id}, process.env.JWT_SECRET, {
            expiresIn: '7d'
            })

        setAuthCookie(res, token)
        
        res.status(201).json({message: 'user logged in successfully',
            token, user: {id: user._id, name: user.name, email: user.email}})
    }catch (error){
        res.status(500).json({error: error.message})
    }
})


router.get('/:id', async (req,res) => {
    try{
        const user = await User.findById(req.params.id).select('-password')
        if(!user) 
            return res.status(404).json({error: 'user not found'})
        res.json(user)
    }catch(error){
        res.status(500).json({error: error.message})
    }
})

router.get('/me/profile', async (req,res) => {
    try{
        const user = await User.findById(req.params.id).select('-password')
        if(!user) 
            return res.status(404).json({error: 'user not found'})
        res.json(user)
    }catch(error){
        res.status(500).json({error: error.message})
    }
})

export default router
