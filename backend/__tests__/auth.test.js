const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');

jest.mock('../models/User'); // Mock the database model so we don't need a real MongoDB for basic tests

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and return a token', async () => {
      // Setup mock behavior
      User.findOne.mockResolvedValue(null); // User does not exist
      
      const mockSavedUser = {
        _id: 'mock_user_id',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password'
      };
      
      // We mock the .save() function on the User instance
      jest.spyOn(User.prototype, 'save').mockResolvedValue(mockSavedUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should return 400 if user already exists', async () => {
      User.findOne.mockResolvedValue({ email: 'test@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'User already exists');
    });
  });
});
