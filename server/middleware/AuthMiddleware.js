import jwt from 'jsonwebtoken'



export const authMiddleware = (req,res,next)=>{
    //const token = req.header('Authorization')?.replace('Bearer ','')
    const cookieToken = req.cookies?.token
    const token = headerToken || cookieToken

    if(!token )
        return res.status(401).json({error: "No token provided"})

    try{
        const decoded = jwt.sign(token , process.env.JWT_SECRET)
        req.user = decoded
        next()
    }catch(error){
        res.status(401).json({error: "Invalid token"})
    }
}