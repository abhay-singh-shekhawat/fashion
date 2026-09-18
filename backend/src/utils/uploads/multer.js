import multer from 'multer';

/* Cloudinary's free plan refuses images above 10MB, so that is the real ceiling
   — a larger multer limit would only move the rejection further downstream.
   Raise both together (this constant and the plan) if that ever changes. */
export const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB) || 10;

// Memory storage (upload to Cloudinary directly)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 }
});

export default upload;
