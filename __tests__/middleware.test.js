import apiMiddleware from '../lib/middleware';

describe('apiMiddleware', () => {
  let dispatch;
  let getState;
  let next;

  beforeEach(() => {
    dispatch = jest.fn();
    getState = jest.fn();
    next = jest.fn();
  });

  it('Should dispatch action success and return the data body - no json', async () => {
    function get() {
      return 'application/x-www-form-urlencoded';
    }

    const apiCallFunction = jest.fn().mockResolvedValue({
      headers: {
        get,
      },
    });

    const action = {
      types: {
        request: 'REQUEST',
        success: 'SUCCESS',
        failure: 'FAILURE',
      },
      apiCallFunction,
    };

    const response = await apiMiddleware({ dispatch, getState })(next)(action);

    expect(next).not.toBeCalled();
    expect(getState).toBeCalled();

    const expectedResponse = {
      headers: {
        get,
      },
    };
    expect(dispatch).toBeCalledWith({
      extraData: {},
      type: 'REQUEST',
    });
    expect(dispatch).toBeCalledWith({
      extraData: {},
      response: expectedResponse,
      type: 'SUCCESS',
    });
    expect(response).toEqual(expectedResponse);
  });

  it('Should dispatch action success and return the data body - json', async () => {
    function get() {
      return 'application/json';
    }

    const body = {
      data: [{ id: 1, name: 'Xbox' }],
    };

    function json() {
      return Promise.resolve(body);
    }

    const apiCallFunction = jest.fn().mockResolvedValue({
      headers: {
        get,
      },
      json,
    });

    const action = {
      types: {
        request: 'REQUEST',
        success: 'SUCCESS',
        failure: 'FAILURE',
      },
      apiCallFunction,
    };

    const response = await apiMiddleware({ dispatch, getState })(next)(action);

    expect(next).not.toBeCalled();
    expect(getState).toBeCalled();

    const expectedResponse = {
      data: body,
      headers: {
        get,
      },
      json,
    };
    expect(dispatch).toBeCalledWith({
      extraData: {},
      type: 'REQUEST',
    });
    expect(dispatch).toBeCalledWith({
      extraData: {},
      response: expectedResponse,
      type: 'SUCCESS',
    });
    expect(response).toEqual(expectedResponse);
  });

  it('Should dispatch action failure when has some error on request - no json', async () => {
    function get() {
      return 'application/x-www-form-urlencoded';
    }

    const body = {
      status: 500,
      message: 'Internal Error',
    };

    function json() {
      return Promise.resolve(body);
    }

    const apiCallFunction = jest.fn().mockRejectedValue({
      headers: {
        get,
      },
      json,
    });

    const action = {
      types: {
        request: 'REQUEST',
        success: 'SUCCESS',
        failure: 'FAILURE',
      },
      apiCallFunction,
    };

    const expectedResponse = {
      headers: {
        get,
      },
      json,
    };

    try {
      await apiMiddleware({ dispatch, getState })(next)(action);
    } catch (error) {
      expect(error).toEqual(expectedResponse);
    }

    expect(next).not.toBeCalled();
    expect(getState).toBeCalled();
    expect(dispatch).toBeCalledWith({
      extraData: {},
      type: 'REQUEST',
    });
    expect(dispatch).toBeCalledWith({
      extraData: {},
      response: expectedResponse,
      error: expectedResponse,
      type: 'FAILURE',
    });
  });

  it('Should dispatch action failure when has some error on request - ', async () => {
    function get() {
      return 'application/json';
    }

    const body = {
      status: 500,
      message: 'Internal Error',
    };

    function json() {
      return Promise.resolve(body);
    }

    const apiCallFunction = jest.fn().mockRejectedValue({
      headers: {
        get,
      },
      json,
    });

    const action = {
      types: {
        request: 'REQUEST',
        success: 'SUCCESS',
        failure: 'FAILURE',
      },
      apiCallFunction,
    };

    const expectedResponse = {
      data: body,
      headers: {
        get,
      },
      json,
    };

    try {
      await apiMiddleware({ dispatch, getState })(next)(action);
    } catch (error) {
      expect(error).toEqual(expectedResponse);
    }

    expect(next).not.toBeCalled();
    expect(getState).toBeCalled();
    expect(dispatch).toBeCalledWith({
      extraData: {},
      type: 'REQUEST',
    });
    expect(dispatch).toBeCalledWith({
      extraData: {},
      response: expectedResponse,
      error: expectedResponse,
      type: 'FAILURE',
    });
  });

  it("Should catch error when it doesn't pass all types actions", async () => {
    const action = {
      types: {},
    };

    try {
      await apiMiddleware({ dispatch, getState })(next)(action);
    } catch (error) {
      expect(error).toEqual(
        new Error(
          'Expected action.types to be an object/dict with three keys (request, success and failure), and the values should be strings.',
        ),
      );
    }
  });

  it('Should pass action forwarn if no types are defined', async () => {
    const action = {
      type: 'REQUEST',
    };
    apiMiddleware({ dispatch, getState })(next)(action);
    expect(next).toBeCalledWith(action);
  });

  it('Should catch error when apiCallFunction dependency is not a function', async () => {
    const action = {
      types: {
        request: 'REQUEST',
        success: 'SUCCESS',
        failure: 'FAILURE',
      },
    };

    try {
      await apiMiddleware({ dispatch, getState })(next)(action);
    } catch (error) {
      expect(error).toEqual(new Error('Expected `apiCallFunction` to be a function.'));
    }
  });

  it('Should not call api is shouldCallApi returns false', async () => {
    function get() {
      return 'application/json';
    }

    const body = {
      data: [{ id: 1, name: 'Xbox' }],
    };

    function json() {
      return Promise.resolve(body);
    }

    const apiCallFunction = jest.fn().mockResolvedValue({
      headers: {
        get,
      },
      json,
    });

    const action = {
      types: {
        request: 'REQUEST',
        success: 'SUCCESS',
        failure: 'FAILURE',
      },
      apiCallFunction,
      shouldCallApi: () => false,
    };

    apiMiddleware({ dispatch, getState })(next)(action);

    expect(next).not.toBeCalled();
    expect(getState).toBeCalled();
    expect(dispatch).not.toBeCalled();
  });
});
