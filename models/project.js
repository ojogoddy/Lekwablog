// models/project.js 
const mongoose = require('mongoose');
const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    technologies: [{ type: String }],
    status: { type: String, enum: ['In Progress', 'Completed'], default: 'In Progress' },
    date: { type: String, required: true },  // e.g., '2024'
    links: {
        github: { type: String },
        demo: { type: String },
        paper: { type: String },
    },
    imageUrl: { type: String },  // Optional image
}, { timestamps: true });
module.exports = mongoose.model('Project', projectSchema);