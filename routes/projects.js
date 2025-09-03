const express = require('express');
const router = express.Router();
const Project = require('../models/project');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Reuse Cloudinary config from above

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'project_images',
        allowedFormats: ['jpg', 'png', 'jpeg'],
    },
});
const upload = multer({ storage });

// Create project
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
    const { title, description, technologies, status, date, links } = req.body;
    if (!title || !description) return res.status(400).json({ message: 'Missing fields' });
    try {
        const imageUrl = req.file ? req.file.path : undefined;
        const project = new Project({
            title,
            description,
            technologies: JSON.parse(technologies),  // Assume array as string
            status,
            date,
            links: JSON.parse(links),
            imageUrl,
        });
        await project.save();
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all projects (pagination)
router.get('/', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const projects = await Project.find()
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
        const count = await Project.countDocuments();
        res.json({ projects, totalPages: Math.ceil(count / limit), currentPage: page });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single project
router.get('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update project (similar to post update)
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
    // Similar logic as post update, omitted for brevity
    // Handle fields, image replace/delete
     const { title, content } = req.body;
        try {
            const post = await Post.findById(req.params.id);
            if (!post) return res.status(404).json({ message: 'Post not found' });
    
            if (req.file && post.imageUrl) {
                // Delete old image from Cloudinary
                const publicId = post.imageUrl.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`blog_images/${publicId}`);
            }
    
            const updateData = {
                title,
                content,
                updatedAt: Date.now(),
                imageUrl: req.file ? req.file.path : post.imageUrl,
            };
    
            const updatedPost = await Post.findByIdAndUpdate(req.params.id, updateData, { new: true });
            res.json(updatedPost);
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
});

// Delete project (similar to post delete)
router.delete('/:id', authMiddleware, async (req, res) => {
    // Similar logic as post delete
     try {
            const post = await Post.findById(req.params.id);
            if (!post) return res.status(404).json({ message: 'Post not found' });
    
            if (post.imageUrl) {
                const publicId = post.imageUrl.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`blog_images/${publicId}`);
            }
    
            await Post.findByIdAndDelete(req.params.id);
            res.json({ message: 'Post deleted' });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
});

module.exports = router;
