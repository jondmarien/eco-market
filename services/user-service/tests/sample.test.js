const supertest = require('supertest');
const app = require('../src/server');
const mongoose = require('mongoose');

// Connect to a new in-memory database before running any tests
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecomarket_test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Disconnect from the database after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

// Sample test for the health endpoint
describe('GET /health', () => {
  it('should return 200 OK', async () => {
    const res = await supertest(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('service', 'user-service');
  });
});

