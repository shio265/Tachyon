import { v2 as cloudinary } from 'cloudinary';
import process from 'process';

// Configure Cloudinary using CLOUDINARY_URL
if (process.env.CLOUDINARY_URL) {
  cloudinary.config(process.env.CLOUDINARY_URL);
}

/**
 * Upload image to Cloudinary
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} folder - Cloudinary folder name
 * @param {string} publicId - Optional public ID for the image
 * @returns {Promise<Object>} Cloudinary upload result with secure_url
 */
async function uploadImage(fileBuffer, folder = 'rewards', publicId = null) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder,
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [
        { width: 512, height: 512, crop: 'limit' }, // Max size 512x512
        { quality: 'auto' }, // Auto quality optimization
        { fetch_format: 'auto' } // Auto format selection
      ]
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    // Upload from buffer
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise<Object>} Deletion result
 */
async function deleteImage(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
}

/**
 * Check if Cloudinary is configured
 * @returns {boolean}
 */
function isConfigured() {
  return !!process.env.CLOUDINARY_URL;
}

export { uploadImage, deleteImage, isConfigured };
