const axios = require('axios');

const DEFAULT_ADMIN = {
  email: 'admin@ecomarket.com',
  password: 'Admin123!',
  firstName: 'Admin',
  lastName: 'User',
  role: 'Admin'
};

async function createAdminUser() {
  try {
    console.log('Creating default admin user...');
    
    // First, try to register the admin user
    const response = await axios.post('http://localhost:8001/api/v1/auth/register', {
      email: DEFAULT_ADMIN.email,
      password: DEFAULT_ADMIN.password,
      firstName: DEFAULT_ADMIN.firstName,
      lastName: DEFAULT_ADMIN.lastName,
      role: DEFAULT_ADMIN.role
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', DEFAULT_ADMIN.email);
    console.log('🔑 Password:', DEFAULT_ADMIN.password);
    console.log('🎭 Role:', DEFAULT_ADMIN.role);
    console.log('\nYou can now log in to the admin dashboard using these credentials.');
    
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      console.log('ℹ️  Admin user already exists!');
      console.log('📧 Email:', DEFAULT_ADMIN.email);
      console.log('🔑 Password:', DEFAULT_ADMIN.password);
      console.log('\nTry logging in with these credentials.');
    } else {
      console.error('❌ Error creating admin user:', error.response?.data || error.message);
      console.log('\nMake sure the User Service is running on port 8001');
      console.log('You can start it with: npm run --prefix services/user-service dev');
    }
  }
}

// Test if User Service is running first
async function checkUserService() {
  try {
    await axios.get('http://localhost:8001/health');
    console.log('✅ User Service is running');
    return true;
  } catch (error) {
    console.log('❌ User Service is not running or not accessible');
    console.log('Please start it with: npm run --prefix services/user-service dev');
    return false;
  }
}

async function main() {
  console.log('🚀 EcoMarket Admin Setup');
  console.log('========================');
  
  const isServiceRunning = await checkUserService();
  if (isServiceRunning) {
    await createAdminUser();
  }
}

main();
