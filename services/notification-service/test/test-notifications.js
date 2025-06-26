const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3003';
const API_URL = `${BASE_URL}/api/notifications`;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

const log = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Test functions
const testHealthCheck = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    log('green', '✓ Health check passed');
    console.log('  Response:', response.data);
    return true;
  } catch (error) {
    log('red', '✗ Health check failed');
    console.log('  Error:', error.message);
    return false;
  }
};

const testServiceHealth = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    log('green', '✓ Service health check passed');
    console.log('  Response:', response.data);
    return true;
  } catch (error) {
    log('red', '✗ Service health check failed');
    console.log('  Error:', error.message);
    return false;
  }
};

const testSendEmail = async () => {
  try {
    const emailData = {
      to: 'test@example.com',
      subject: 'Test Email from Notification Service',
      message: 'This is a test email to verify the notification service is working correctly.',
      templateId: 'welcome',
      templateData: {
        customerName: 'Test User',
        companyName: 'EcoMarket',
      },
    };

    const response = await axios.post(`${API_URL}/email`, emailData);
    log('green', '✓ Email sending test passed');
    console.log('  Response:', response.data);
    return true;
  } catch (error) {
    log('yellow', '⚠ Email sending test failed (expected if no email config)');
    console.log('  Error:', error.response?.data || error.message);
    return false;
  }
};

const testSendSMS = async () => {
  try {
    const smsData = {
      to: '+1234567890',
      message: 'Test SMS from EcoMarket Notification Service',
      templateId: 'order-confirmation',
      templateData: {
        customerName: 'Test User',
        orderNumber: 'TEST001',
        orderTotal: '99.99',
      },
    };

    const response = await axios.post(`${API_URL}/sms`, smsData);
    log('green', '✓ SMS sending test passed');
    console.log('  Response:', response.data);
    return true;
  } catch (error) {
    log('yellow', '⚠ SMS sending test failed (expected if no SMS config)');
    console.log('  Error:', error.response?.data || error.message);
    return false;
  }
};

const testSendNotification = async () => {
  try {
    const notificationData = {
      type: 'order-confirmation',
      title: 'Order Confirmed',
      message: 'Your EcoMarket order has been confirmed!',
      channels: ['email'],
      userId: 'test-user-123',
      templateId: 'order-confirmation',
      templateData: {
        customerName: 'Test User',
        orderNumber: 'TEST001',
        orderTotal: '99.99',
        orderUrl: 'https://ecomarket.example.com/orders/TEST001',
      },
      priority: 'normal',
      metadata: {
        email: 'test@example.com',
        orderId: 'TEST001',
      },
    };

    const response = await axios.post(`${API_URL}/send`, notificationData);
    log('green', '✓ Notification sending test passed');
    console.log('  Response:', response.data);
    return response.data.data.notificationId;
  } catch (error) {
    log('red', '✗ Notification sending test failed');
    console.log('  Error:', error.response?.data || error.message);
    return null;
  }
};

const testGetNotification = async (notificationId) => {
  if (!notificationId) {
    log('yellow', '⚠ Skipping get notification test (no notification ID)');
    return false;
  }

  try {
    const response = await axios.get(`${API_URL}/${notificationId}`);
    log('green', '✓ Get notification test passed');
    console.log('  Response:', response.data);
    return true;
  } catch (error) {
    log('red', '✗ Get notification test failed');
    console.log('  Error:', error.response?.data || error.message);
    return false;
  }
};

const testUserPreferences = async () => {
  try {
    const userId = 'test-user-123';
    
    // Update preferences
    const preferences = {
      email: 'test@example.com',
      phone: '+1234567890',
      globalOptOut: false,
      channels: {
        email: { enabled: true },
        sms: { enabled: true },
        push: { enabled: false },
      },
      notificationTypes: {
        'order-confirmation': {
          email: true,
          sms: true,
          push: false,
        },
        'marketing': {
          email: false,
          sms: false,
          push: false,
        },
      },
    };

    const updateResponse = await axios.put(`${API_URL}/user/${userId}/preferences`, preferences);
    log('green', '✓ Update user preferences test passed');
    console.log('  Update Response:', updateResponse.data);

    // Get preferences
    const getResponse = await axios.get(`${API_URL}/user/${userId}/preferences`);
    log('green', '✓ Get user preferences test passed');
    console.log('  Get Response:', getResponse.data);

    return true;
  } catch (error) {
    log('red', '✗ User preferences test failed');
    console.log('  Error:', error.response?.data || error.message);
    return false;
  }
};

const testGetStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/stats`);
    log('green', '✓ Get stats test passed');
    console.log('  Response:', response.data);
    return true;
  } catch (error) {
    log('red', '✗ Get stats test failed');
    console.log('  Error:', error.response?.data || error.message);
    return false;
  }
};

const testGetUserHistory = async () => {
  try {
    const userId = 'test-user-123';
    const response = await axios.get(`${API_URL}/user/${userId}?page=1&limit=10`);
    log('green', '✓ Get user history test passed');
    console.log('  Response:', response.data);
    return true;
  } catch (error) {
    log('red', '✗ Get user history test failed');
    console.log('  Error:', error.response?.data || error.message);
    return false;
  }
};

const testValidation = async () => {
  try {
    // Test invalid request (missing required fields)
    const invalidData = {
      message: 'Missing required fields',
    };

    await axios.post(`${API_URL}/send`, invalidData);
    log('red', '✗ Validation test failed (should have been rejected)');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      log('green', '✓ Validation test passed (correctly rejected invalid request)');
      console.log('  Validation errors:', error.response.data);
      return true;
    } else {
      log('red', '✗ Validation test failed (unexpected error)');
      console.log('  Error:', error.response?.data || error.message);
      return false;
    }
  }
};

// Main test runner
const runTests = async () => {
  log('blue', '🚀 Starting Notification Service Tests');
  console.log('');

  const results = [];

  // Basic connectivity tests
  log('blue', '--- Basic Connectivity Tests ---');
  results.push(await testHealthCheck());
  results.push(await testServiceHealth());
  console.log('');

  // Core functionality tests
  log('blue', '--- Core Functionality Tests ---');
  const notificationId = await testSendNotification();
  results.push(!!notificationId);
  results.push(await testGetNotification(notificationId));
  console.log('');

  // Service-specific tests
  log('blue', '--- Service-specific Tests ---');
  results.push(await testSendEmail());
  results.push(await testSendSMS());
  console.log('');

  // User management tests
  log('blue', '--- User Management Tests ---');
  results.push(await testUserPreferences());
  results.push(await testGetUserHistory());
  console.log('');

  // Analytics tests
  log('blue', '--- Analytics Tests ---');
  results.push(await testGetStats());
  console.log('');

  // Validation tests
  log('blue', '--- Validation Tests ---');
  results.push(await testValidation());
  console.log('');

  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  log('blue', '--- Test Summary ---');
  console.log(`Total tests: ${total}`);
  log('green', `Passed: ${passed}`);
  log('red', `Failed: ${total - passed}`);
  
  if (passed === total) {
    log('green', '🎉 All tests passed!');
  } else {
    log('yellow', '⚠ Some tests failed. This is expected if email/SMS providers are not configured.');
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    log('red', '💥 Test runner crashed');
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testHealthCheck,
  testSendNotification,
  testSendEmail,
  testSendSMS,
};
