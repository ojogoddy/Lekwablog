// const express = require('express');
// const router = express.Router();
// const Project = require('../models/project');
// const authMiddleware = require('../middleware/authMiddleware');
// const multer = require('multer');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const cloudinary = require('cloudinary').v2;

// // Reuse Cloudinary config from above

// const storage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: {
//         folder: 'project_images',
//         allowedFormats: ['jpg', 'png', 'jpeg'],
//     },
// });
// const upload = multer({ storage });

// // Create project
// router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
//     const { title, description, technologies, status, date, links } = req.body;
//     if (!title || !description) return res.status(400).json({ message: 'Missing fields' });
//     try {
//         const imageUrl = req.file ? req.file.path : undefined;
//         const project = new Project({
//             title,
//             description,
//             technologies: JSON.parse(technologies),  // Assume array as string
//             status,
//             date,
//             links: JSON.parse(links),
//             imageUrl,
//         });
//         await project.save();
//         res.status(201).json(project);
//     } catch (error) {
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// // Get all projects (pagination)
// router.get('/', async (req, res) => {
//     const { page = 1, limit = 10 } = req.query;
//     try {
//         const projects = await Project.find()
//             .sort({ createdAt: -1 })
//             .limit(limit * 1)
//             .skip((page - 1) * limit)
//             .exec();
//         const count = await Project.countDocuments();
//         res.json({ projects, totalPages: Math.ceil(count / limit), currentPage: page });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// // Get single project
// router.get('/:id', async (req, res) => {
//     try {
//         const project = await Project.findById(req.params.id);
//         if (!project) return res.status(404).json({ message: 'Project not found' });
//         res.json(project);
//     } catch (error) {
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// // Update project (similar to post update)
// router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
//     // Similar logic as post update, omitted for brevity
//     // Handle fields, image replace/delete
//      const { title, content } = req.body;
//         try {
//             const post = await Post.findById(req.params.id);
//             if (!post) return res.status(404).json({ message: 'Post not found' });
    
//             if (req.file && post.imageUrl) {
//                 // Delete old image from Cloudinary
//                 const publicId = post.imageUrl.split('/').pop().split('.')[0];
//                 await cloudinary.uploader.destroy(`blog_images/${publicId}`);
//             }
    
//             const updateData = {
//                 title,
//                 content,
//                 updatedAt: Date.now(),
//                 imageUrl: req.file ? req.file.path : post.imageUrl,
//             };
    
//             const updatedPost = await Post.findByIdAndUpdate(req.params.id, updateData, { new: true });
//             res.json(updatedPost);
//         } catch (error) {
//             res.status(500).json({ message: 'Server error' });
//         }
// });

// // Delete project (similar to post delete)
// router.delete('/:id', authMiddleware, async (req, res) => {
//     // Similar logic as post delete
//      try {
//             const post = await Post.findById(req.params.id);
//             if (!post) return res.status(404).json({ message: 'Post not found' });
    
//             if (post.imageUrl) {
//                 const publicId = post.imageUrl.split('/').pop().split('.')[0];
//                 await cloudinary.uploader.destroy(`blog_images/${publicId}`);
//             }
    
//             await Post.findByIdAndDelete(req.params.id);
//             res.json({ message: 'Post deleted' });
//         } catch (error) {
//             res.status(500).json({ message: 'Server error' });
//         }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const Project = require('../models/project');
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

// Create project
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
    const { title, description, technologies, status, date, links } = req.body;
    if (!title || !description) return res.status(400).json({ message: 'Missing fields' });
    try {
        let imageUrl = undefined;
        if (req.file) {
            // Upload to Cloudinary
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'project_images',
                        allowed_formats: ['jpg', 'png', 'jpeg'],
                        public_id: `project_${Date.now()}`,
                    },
                    (error, result) => (error ? reject(error) : resolve(result))
                );
                Readable.from(req.file.buffer).pipe(stream);
            });
            imageUrl = result.secure_url;
        }

        const project = new Project({
            title,
            description,
            technologies: JSON.parse(technologies), // Assume array as string
            status,
            date,
            links: JSON.parse(links),
            imageUrl,
        });
        await project.save();
        res.status(201).json(project);
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all projects (pagination)
router.get('/', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const projects = await Project.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit * 1)
            .exec();
        const count = await Project.countDocuments();
        res.json({ projects, totalPages: Math.ceil(count / limit), currentPage: page });
    } catch (error) {
        console.error('Get projects error:', error);
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
        console.error('Get project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update project
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
    const { title, description, technologies, status, date, links } = req.body;
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        let imageUrl = project.imageUrl;
        if (req.file) {
            // Delete old image from Cloudinary if it exists
            if (project.imageUrl) {
                const publicId = project.imageUrl.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`project_images/${publicId}`);
            }
            // Upload new image to Cloudinary
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'project_images',
                        allowed_formats: ['jpg', 'png', 'jpeg'],
                        public_id: `project_${Date.now()}`,
                    },
                    (error, result) => (error ? reject(error) : resolve(result))
                );
                Readable.from(req.file.buffer).pipe(stream);
            });
            imageUrl = result.secure_url;
        }

        const updateData = {
            title,
            description,
            technologies: technologies ? JSON.parse(technologies) : project.technologies,
            status: status || project.status,
            date: date || project.date,
            links: links ? JSON.parse(links) : project.links,
            imageUrl,
            updatedAt: Date.now(),
        };

        const updatedProject = await Project.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updatedProject);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete project
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (project.imageUrl) {
            const publicId = project.imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`project_images/${publicId}`);
        }

        await Project.findByIdAndDelete(req.params.id);
        res.json({ message: 'Project deleted' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;