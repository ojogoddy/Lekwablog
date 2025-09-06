const multer = require("multer");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads"); // Directory to save file
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Unique file name
    },
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedType = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedType.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPEG, PNG, JPG are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 1024 * 1024 * 10 }, // 10MB
}).array("imageUrl", 5);

module.exports = upload;
