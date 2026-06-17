import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn("⚠️ CLOUDINARY ENVIRONMENT VARIABLES ARE MISSING! Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your Vercel Project Environment Variables.");
}

cloudinary.config({
  cloud_name: cloudName || "dummy_cloud_name",
  api_key: apiKey || "dummy_api_key",
  api_secret: apiSecret || "dummy_api_secret",
  secure: true,
});

export default cloudinary;
