// const express = require('express');
// const router = express.Router();
// const Post = require('../models/posts');
// const authMiddleware = require('../middleware/authMiddleware');
// const multer = require('multer');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const cloudinary = require('cloudinary').v2;

// // cloudinary config
// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
// });
// const storage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: {
//         folder: 'blog_images',
//         allowed_formats: ['jpg', 'png', 'jpeg'],
//     },
// });
// const upload = multer({ storage });

// // Create post
// router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
//     const { title, content } = req.body;
//     if (!title || !content) return res.status(400).json({ message: 'Missing fields' });
//     try {
//         const imageUrl = req.file ? req.file.path : undefined;
//         const post = new Post({ title, content, imageUrl });
//         await post.save();
//         res.status(201).json(post);
//     } catch (error) {
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// // Read all posts (/with pagination)
// router.get('/', async (req, res) => {
//     const { page = 1, limit = 10 } = req.query;
//     try {
//         const posts = await Post.find()
//             .sort({ createdAt: -1 })
//             .skip((page - 1) * limit)
//             .limit(limit * 1)
//             .exec();
//         const count = await Post.countDocuments();
//         res.json({posts, totalPages: Math.ceil(count / limit), currentPage: page });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// // Read single post
// router.get('/:id', async (req, res) => {
//     try {
//         const post = await Post.findById(req.params.id);
//         if (!post) return res.status(404).json({ message: 'Post not found' });
//         res.json(post);
//     } catch (error) {
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// // Update post
// router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
//     const { title, content } = req.body;
//     try {
//         const post = await Post.findById(req.params.id);
//         if (!post) return res.status(404).json({ message: 'Post not found' });

//         if (req.file && post.imageUrl) {
//             // Delete old image from Cloudinary
//             const publicId = post.imageUrl.split('/').pop().split('.')[0];
//             await cloudinary.uploader.destroy(`blog_images/${publicId}`);
//         }

//         const updateData = {
//             title,
//             content,
//             updatedAt: Date.now(),
//             imageUrl: req.file ? req.file.path : post.imageUrl,
//         };

//         const updatedPost = await Post.findByIdAndUpdate(req.params.id, updateData, { new: true });
//         res.json(updatedPost);
//     } catch (error) {
//         res.status(500).json({ message: 'Server error' });
//     }
// });


// // Delete post

// router.delete('/:id', authMiddleware, async (req, res) => {
//     try {
//         const post = await Post.findById(req.params.id);
//         if (!post) return res.status(404).json({ message: 'Post not found' });

//         if (post.imageUrl) {
//             const publicId = post.imageUrl.split('/').pop().split('.')[0];
//             await cloudinary.uploader.destroy(`blog_images/${publicId}`);
//         }

//         await Post.findByIdAndDelete(req.params.id);
//         res.json({ message: 'Post deleted' });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// // export the router
// module.exports = router;

const express = require('express');
const router = express.Router();
const Post = require('../models/posts');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer with memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Create post
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Missing fields' });
    try {
        let imageUrl = undefined;
        if (req.file) {
            // Upload to Cloudinary
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'blog_images',
                        allowed_formats: ['jpg', 'png', 'jpeg'],
                        public_id: `post_${Date.now()}`,
                    },
                    (error, result) => (error ? reject(error) : resolve(result))
                );
                Readable.from(req.file.buffer).pipe(stream);
            });
            imageUrl = result.secure_url;
        }

        const post = new Post({ title, content, imageUrl });
        await post.save();
        res.status(201).json(post);
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Read all posts (with pagination)
router.get('/', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit * 1)
            .exec();
        const count = await Post.countDocuments();
        res.json({ posts, totalPages: Math.ceil(count / limit), currentPage: page });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Read single post
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.json(post);
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update post
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
    const { title, content } = req.body;
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        let imageUrl = post.imageUrl;
        if (req.file) {
            // Delete old image from Cloudinary if it exists
            if (post.imageUrl) {
                const publicId = post.imageUrl.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`blog_images/${publicId}`);
            }
            // Upload new image to Cloudinary
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'blog_images',
                        allowed_formats: ['jpg', 'png', 'jpeg'],
                        public_id: `post_${Date.now()}`,
                    },
                    (error, result) => (error ? reject(error) : resolve(result))
                );
                Readable.from(req.file.buffer).pipe(stream);
            });
            imageUrl = result.secure_url;
        }

        const updateData = {
            title,
            content,
            updatedAt: Date.now(),
            imageUrl,
        };

        const updatedPost = await Post.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updatedPost);
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete post
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        // if (post.imageUrl) {
        //     const publicId = post.imageUrl.split('/').pop().split('.')[0];
        //     await cloudinary.uploader.destroy(`blog_images/${publicId}`);
        // }
        if (post.imageUrl) {
            try {
                const publicId = post.imageUrl.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`blog_images/${publicId}`);
            } catch (err) {
                console.error("Cloudinary delete error:", err.message);
                // don't throw, just log it
            }
          }

        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Export the router
module.exports = router;