const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const cloudinary = require('../config/cloudinary');
const upload = require('../config/multer');
const Post = require('../models/posts');

// Create post
router.post('/post', authMiddleware, upload, async (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    try {
        let images = [];

        if (req.files && Array.isArray(req.files)) {
            const fileArray = req.files.slice(0, 5);

            for (const file of fileArray) {
                const uploadedImage = await cloudinary.uploader.upload(file.path);
                images.push(uploadedImage.secure_url);
            }
        }

        const post = await Post.create({
            title,
            content,
            imageUrl: images,
        });

        return res.status(201).json(post);
    } catch (error) {
        console.error('Create post error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
