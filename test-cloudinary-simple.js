const cloudinary = require('cloudinary').v2;
const https = require('https');

// Test credentials
const config = {
  cloud_name: 's7xamvvg',
  api_key: '396387138889537',
  api_secret: 'dBHk7JjTh-WmfmynZYi2QynVi_o'
};

cloudinary.config(config);

console.log('Testing Cloudinary API access...\n');

// Test 1: List resources (simpler API call)
cloudinary.api.resources(
  { max_results: 1, resource_type: 'image' },
  (error, result) => {
    if (error) {
      console.error('❌ API Test FAILED');
      console.error('Status:', error.http_code);
      console.error('Message:', error.message);
      console.error('\n📝 This means:');
      
      if (error.http_code === 401) {
        console.error('   - Authentication failed');
        console.error('   - API Key or Secret is incorrect');
        console.error('   - Please verify credentials in Cloudinary dashboard');
      } else if (error.http_code === 499 || error.name === 'TimeoutError') {
        console.error('   - Network timeout');
        console.error('   - Firewall might be blocking Cloudinary');
        console.error('   - Try using Local Storage instead');
      } else {
        console.error('   - Unknown error:', error);
      }
    } else {
      console.log('✅ API Test SUCCESS!');
      console.log('   - Authentication works');
      console.log('   - Cloudinary is accessible');
      console.log('   - Total resources:', result.resources.length);
    }
  }
);
