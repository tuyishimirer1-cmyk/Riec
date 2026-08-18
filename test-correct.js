const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 's7xamyvg',  // Correct: with 'y'
  api_key: '396387138889537',
  api_secret: 'dBHk7JjTh-WmfmynZYi2QynVi_o'
});

console.log('Testing with CORRECT cloud name: s7xamyvg\n');

cloudinary.api.resources(
  { max_results: 1, resource_type: 'image' },
  (error, result) => {
    if (error) {
      console.error('❌ FAILED:', error.message);
      console.error('Status:', error.http_code);
    } else {
      console.log('✅ SUCCESS! Authentication works!');
      console.log('Resources found:', result.resources.length);
    }
  }
);
