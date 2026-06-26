const request = require('supertest');
const { app } = require('../server');

// Custom Mocks for Models
jest.mock('../models/Meeting', () => {
  return class Meeting {
    constructor(data) {
      Object.assign(this, data);
    }
    save() {
      return Promise.resolve(this);
    }
    static find = jest.fn();
    static findById = jest.fn();
  };
});

// Mock auth middleware
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((token, secret, callback) => {
    callback(null, { userId: 'mock_user_id' });
  })
}));

const Meeting = require('../models/Meeting');
const Workspace = require('../models/Workspace');

jest.mock('../models/Workspace', () => {
  return {
    findById: jest.fn().mockResolvedValue({
      ownerId: 'mock_user_id',
      members: [{ _id: 'mock_user_id' }]
    })
  };
});

describe('Meetings API Security & Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/meetings', () => {
    it('should return 400 if workspaceId is missing (Validation Security)', async () => {
      const response = await request(app)
        .get('/api/meetings')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Workspace ID is required');
    });

    it('should fetch meetings for a given workspace', async () => {
      const mockResult = [
        { _id: 'm1', title: 'Q1 Review', workspaceId: 'ws_1' }
      ];
      Meeting.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockResult)
      });

      const response = await request(app)
        .get('/api/meetings?workspaceId=ws_1')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Q1 Review');
    });
  });

  describe('POST /api/meetings', () => {
    it('should create a new meeting securely', async () => {
      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', 'Bearer valid_token')
        .send({ title: 'New Sync', agenda: 'Discuss MVP', workspaceId: 'ws_1' });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('New Sync');
      expect(response.body.workspaceId).toBe('ws_1');
    });
  });
});
