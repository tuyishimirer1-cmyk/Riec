const cloudinary = require('cloudinary').v2;

// Test credentials
cloudinary.config({
  cloud_name: 's7xamvvg',
  api_key: '396387138889537',
  api_secret: 'dBHk7JjTh-WmfmynZYi2QynVi_o'
});

console.log('Testing Cloudinary connection...');
console.log('Config:', cloudinary.config());

// Try to upload a test
const testBuffer = Buffer.from('test image data');
const uploadStream = cloudinary.uploader.upload_stream(
  { folder: 'test', resource_type: 'auto' },
  (error, result) => {
    if (error) {
      console.error('❌ Upload FAILED:', error.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Upload SUCCESS!');
      console.log('Result:', result);
    }
  }
);

uploadStream.end(testBuffer);
