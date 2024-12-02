import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp'); // Ensure the directory exists
    },
    filename: function (req, file, cb) {
        const filename = `${Date.now()}_${file.originalname}`;
        console.log("Generated Filename:", filename); // Log filename during execution
        cb(null, filename);
    }
});

const upload = multer({ storage });

export { upload };
