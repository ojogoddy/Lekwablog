const mongoose = require('mongoose');
const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date},
}, {timestamps: true});
module.exports = mongoose.model('Post', postSchema);

