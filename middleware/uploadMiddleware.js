import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDirectory = path.resolve(
  "uploads",
  "verifications"
);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (req, file, callback) => {
    const safeOriginalName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .toLowerCase();

    const uniqueName = [
      req.user?.id || "user",
      Date.now(),
      Math.round(Math.random() * 1_000_000),
      safeOriginalName,
    ].join("-");

    callback(null, uniqueName);
  },
});

function fileFilter(req, file, callback) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return callback(
      new Error("Only JPG, PNG and PDF documents are allowed")
    );
  }

  callback(null, true);
}

export const verificationUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 2,
  },
});

const vehicleUploadDirectory = path.resolve(
  "uploads",
  "vehicles"
);

fs.mkdirSync(vehicleUploadDirectory, {
  recursive: true,
});

const vehicleStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, vehicleUploadDirectory);
  },

  filename: (req, file, callback) => {
    const safeOriginalName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .toLowerCase();

    const uniqueName = [
      req.user?.id || "driver",
      Date.now(),
      Math.round(Math.random() * 1_000_000),
      safeOriginalName,
    ].join("-");

    callback(null, uniqueName);
  },
});

export const vehicleUpload = multer({
  storage: vehicleStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});