import { fetchFromApi } from './api';

describe('fetchFromApi', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('should resolve fetch and return data with error', async () => {
    fetch.mockResolvedValue({
      status: 400,
      message: 'The name is empty',
    });

    const header = {
      method: 'POST',
      body: { name: '' },
    };
    try {
      await fetchFromApi('http://localhost:3000/products');
    } catch (e) {
      expect(e).toEqual({
        status: 400,
        message: 'The name is empty',
      });
    }
  });

  it('should resolve fetch and return data', async () => {
    fetch.mockResolvedValue({
      data: [
        { name: 'Xbox' },
      ],
    });

    const response = await fetchFromApi('http://localhost:3000/products');

    expect(response).toEqual({
      data: [
        { name: 'Xbox' },
      ],
    });
  });
  
  it('should reject fetch and catch by error', async () => {
    fetch.mockRejectedValue(new Error('404 Not found'));
    try {
      await fetchFromApi('http://localhost:3000/products/999');
    } catch (e) {
      expect(e).toEqual(new Error('404 Not found'));
    }
  });
});
