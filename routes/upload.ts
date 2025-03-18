import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { dbHelpers } from "../app";
import type { DbHelpers } from "../types";

const router = express.Router();
const PROJECT_ROOT = path.join(__dirname, "..");

const dbh = dbHelpers as DbHelpers;

// Create a temporary upload directory
const tempUploadDir = path.join(PROJECT_ROOT, 'temp_uploads');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

// Configure multer for temporary storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed') as any);
    }
  }
});

// Handle conspect image upload
router.post("/conspectImage", upload.single('image'), async (req, res) => {
  try {
    const { auth_key, course, blockId, testId } = req.body;
    
    // Verify user authorization
    const user = await dbh.getUserByAuthKey(auth_key);
    if (!user || (user.group_type !== "admin" && user.group_type !== "teacher")) {
      // Delete uploaded file if unauthorized
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).send("Unauthorized");
    }

    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    if (!course || !blockId || !testId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).send("Missing required parameters");
    }

    // Create the final directory path
    const finalDir = path.join(
      PROJECT_ROOT,
      `courseData/${course}/block${blockId}/test${testId}/conspectImages`
    );

    // Create directory if it doesn't exist
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }

    // Move file from temp to final location
    const finalPath = path.join(finalDir, req.file.filename);
    fs.renameSync(req.file.path, finalPath);

    // Generate relative URL for the image
    const relativeUrl = `/courseData/${course}/block${blockId}/test${testId}/conspectImages/${req.file.filename}`;

    res.json({
      url: relativeUrl,
      message: "Image uploaded successfully"
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    // Clean up file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).send("Error uploading image");
  }
});

export default router; 