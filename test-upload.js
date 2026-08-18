const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000/api';

async function testProjectWithImage() {
  console.log('🚀 Testing Project Creation with Image in Murugarama...\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'izerelibert@gmail.com',
      password: 'SecurePass123!'
    });
    
    const token = loginResponse.data.data?.accessToken || loginResponse.data.accessToken;
    console.log('✅ Logged in successfully!\n');

    // Step 2: Create Project
    console.log('2️⃣ Creating project in Murugarama...');
    const projectData = {
      title: 'Murugarama Modern House',
      description: '<p>Beautiful modern house in Murugarama location with stunning views</p>',
      location: 'Murugarama, Rwanda',
      type: 'COMPLETED',
      category: 'RESIDENTIAL',
      featured: true,
      purchasable: false,
      serviceSlugs: []
    };

    const projectResponse = await axios.post(`${BASE_URL}/projects`, projectData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const project = projectResponse.data.data || projectResponse.data;
    console.log('✅ Project created!');
    console.log(`   ID: ${project.id}`);
    console.log(`   Title: ${project.title}`);
    console.log(`   Location: ${project.location}`);
    console.log(`   Slug: ${project.slug}\n`);

    // Step 3: Create test image (1x1 red pixel PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
      'base64'
    );
    
    fs.writeFileSync('./test-image.png', testImageBuffer);

    // Step 4: Upload Image
    console.log('3️⃣ Uploading test image...');
    const formData = new FormData();
    formData.append('files', fs.createReadStream('./test-image.png'), {
      filename: 'murugarama-house.png',
      contentType: 'image/png'
    });

    const uploadResponse = await axios.post(
      `${BASE_URL}/projects/${project.id}/images`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    const images = uploadResponse.data.data || uploadResponse.data;
    console.log('✅ Image uploaded successfully!');
    console.log(`   Count: ${images.length} image(s)`);
    if (images[0]) {
      console.log(`   URL: ${images[0].url}`);
      console.log(`   Cloudinary ID: ${images[0].s3Key}\n`);
    }

    // Step 5: Publish Project
    console.log('4️⃣ Publishing project...');
    await axios.post(
      `${BASE_URL}/projects/identifier/${project.id}/publish`,
      {},
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    console.log('✅ Project published!\n');

    // Step 6: Verify on Frontend (Public API)
    console.log('5️⃣ Checking frontend visibility...');
    const publicResponse = await axios.get(`${BASE_URL}/projects`);
    const allProjects = publicResponse.data.data || publicResponse.data;
    
    const foundOnFrontend = allProjects.find(p => p.id === project.id);
    
    if (foundOnFrontend) {
      console.log('✅ PROJECT IS VISIBLE ON FRONTEND!');
      console.log(`   Title: ${foundOnFrontend.title}`);
      console.log(`   Location: ${foundOnFrontend.location}`);
      console.log(`   Published: Yes\n`);
    }

    // Step 7: Get Full Project Details with Images
    console.log('6️⃣ Getting project details with images...');
    const detailResponse = await axios.get(`${BASE_URL}/projects/${project.id}`);
    const fullProject = detailResponse.data.data || detailResponse.data;
    
    console.log('✅ Full project retrieved:');
    console.log(`   Images attached: ${fullProject.images?.length || 0}`);
    
    if (fullProject.images && fullProject.images.length > 0) {
      console.log(`   Image URL: ${fullProject.images[0].url}`);
      console.log(`   Image Caption: ${fullProject.images[0].caption || 'No caption'}\n`);
    }

    // Cleanup
    fs.unlinkSync('./test-image.png');

    // Final Summary
    console.log('\n═══════════════════════════════════════════');
    console.log('✅ TEST COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════');
    console.log('\n📊 PROJECT SUMMARY:');
    console.log(`   • Title: ${fullProject.title}`);
    console.log(`   • Location: ${fullProject.location}`);
    console.log(`   • Images: ${fullProject.images?.length || 0}`);
    console.log(`   • Published: ${fullProject.isPublished ? 'Yes' : 'No'}`);
    console.log(`\n🌐 VIEW ON FRONTEND:`);
    console.log(`   http://localhost:5173/projects/${fullProject.slug || fullProject.id}`);
    console.log(`\n📝 MANAGE IN ADMIN:`);
    console.log(`   http://localhost:5173/dashboard/projects\n`);
    
    return { success: true, project: fullProject };

  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
    return { success: false, error: error.message };
  }
}

testProjectWithImage()
  .then(result => {
    process.exit(result.success ? 0 : 1);
  });
