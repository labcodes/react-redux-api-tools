const validateAction = action => {
  const { types, apiCallFunction } = action;
  const expectedTypes = ['request', 'success', 'failure'];

  if (
    Object.values(types).length !== 3 ||
    !Object.keys(types).every(type => expectedTypes.includes(type)) ||
    !Object.values(types).every(type => typeof type === 'string')
  ) {
    throw new Error(
      'Expected action.types to be an object/dict with three keys (request, success and failure), and the values should be strings.',
    );
  }

  if (typeof apiCallFunction !== 'function') {
    throw new Error('Expected `apiCallFunction` to be a function.');
  }
};

function apiMiddleware({ dispatch, getState }) {
  return next => action => {
    const { types, apiCallFunction, shouldCallApi = () => true, extraData = {} } = action;

    if (!types) {
      // if this is a normal use of redux, we just pass on the action
      return next(action);
    }

    // here, we validate the dependencies for the middleware
    validateAction(action);

    // then, to prevent accidental api calls,
    // we can check the state before calling
    if (!shouldCallApi(getState(), action)) {
      return new Promise(() => {}); // so we can still call .then when we dispatch
    }

    // we dispatch the request action, so the interface can react to it
    dispatch({ extraData, type: types.request });

    // at last, we return a promise with the proper api call
    return new Promise((resolve, reject) => {
      apiCallFunction(dispatch)
        .then(response => {
          // if it's a json response, we unpack and parse it
          if (response.headers.get('content-type') === 'application/json') {
            response.json().then(data => {
              response.data = data; // from backend response
              dispatch({ extraData, response, type: types.success });
              resolve(response);
            });
          } else {
            dispatch({ extraData, response, type: types.success });
            resolve(response);
          }
        })
        .catch(error => {
          // if it's a json response, we unpack and parse it
          if (error.headers && error.headers.get('content-type') === 'application/json') {
            error.json().then(data => {
              error.data = data; // form backend error
              dispatch({ extraData, error, response: error, type: types.failure });
              reject(error);
            });
          } else {
            dispatch({ extraData, error, response: error, type: types.failure });
            reject(error);
          }
        });
    });
  };
}

export default apiMiddleware;
