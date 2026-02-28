import express from 'express';
import Notification from '../models/Notification.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';

const router = express.Router();

//User must be logged in
router.use(authMiddleware);

//GET the notififcation
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
//Safety check
    if (!userId) {
      return res.status(401).json({ message: 'User not found in request' });
    }

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 }) //start from neweset
      .populate('fromUser', 'name username profileImage')//show name, username and profile image
      .populate('post', 'text image') //show text of the post and image
      .populate('order', 'totalAmount status createdAt'); // for order_placed / sale (order number from _id on frontend)

    return res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ message: 'Failed to load notifications' });
  }
});


// DELETE a single notification (owner only)
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: userId,
    });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

//Mark all unread notifications as read 
router.patch('/mark_read',async(req, res) =>{
try{
const userId= req.user.id;

//Update all notification from read: false to true.
await Notification.updateMany(

{user: userId, read: false},
{$set: {read: true}}
);

res.sendStatus(200);
} catch(error){
console.error('mark_read_error', error);
res.sendStatus(500);
}
});


export default router;
