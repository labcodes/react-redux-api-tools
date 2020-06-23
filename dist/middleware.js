"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = apiMiddleware;

var validateAction = function validateAction(action) {
  var types = action.types,
      apiCallFunction = action.apiCallFunction;
  var expectedTypes = ['request', 'success', 'failure'];

  if (Object.values(types).length !== 3 || !Object.keys(types).every(function (type) {
    return expectedTypes.includes(type);
  }) || !Object.values(types).every(function (type) {
    return typeof type === 'string';
  })) {
    throw new Error('Expected action.types to be an object/dict with three keys (request, success and failure), and the values should be strings.');
  }

  if (typeof apiCallFunction !== 'function') {
    throw new Error('Expected `apiCallFunction` to be a function.');
  }
};

function apiMiddleware(_ref) {
  var dispatch = _ref.dispatch,
      getState = _ref.getState;
  return function (next) {
    return function (action) {
      var types = action.types,
          apiCallFunction = action.apiCallFunction,
          _action$shouldDispatc = action.shouldDispatch,
          shouldDispatch = _action$shouldDispatc === void 0 ? function () {
        return true;
      } : _action$shouldDispatc,
          _action$extraData = action.extraData,
          extraData = _action$extraData === void 0 ? {} : _action$extraData; // to prevent accidental dispatches,
      // we can check the state before calling

      if (!shouldDispatch(getState(), action)) {
        return new Promise(function () {}); // so we can still call .then when we dispatch
      } // this is exclusively for our rel-event library
      // and so is marked as unsafe


      action.__UNSAFE_dispatch = dispatch;

      if (!types) {
        // if this is a normal use of redux, we just pass on the action
        return next(action);
      } // here, we validate the dependencies for the middleware


      validateAction(action); // we dispatch the request action, so the interface can react to it

      dispatch({
        extraData: extraData,
        type: types.request
      }); // at last, we return a promise with the proper api call

      return new Promise(function (resolve, reject) {
        apiCallFunction(dispatch).then(function (response) {
          // if it's a json response, we unpack and parse it
          var contentType = response.headers && typeof response.headers.get === 'function' && response.headers.get('content-type');

          if (contentType && contentType.startsWith('application/json')) {
            response.json().then(function (data) {
              response.data = data; // from backend response

              dispatch({
                extraData: extraData,
                response: response,
                type: types.success
              });
              resolve(response);
            });
          } else {
            dispatch({
              extraData: extraData,
              response: response,
              type: types.success
            });
            resolve(response);
          }
        }).catch(function (error) {
          // if it's a json response, we unpack and parse it
          var contentType = error.headers && typeof error.headers.get === 'function' && error.headers.get('content-type');

          if (contentType && contentType.startsWith('application/json')) {
            error.json().then(function (data) {
              error.data = data; // form backend error

              dispatch({
                extraData: extraData,
                error: error,
                response: error,
                type: types.failure
              });
              reject(error);
            });
          } else {
            dispatch({
              extraData: extraData,
              error: error,
              response: error,
              type: types.failure
            });
            reject(error);
          }
        });
      });
    };
  };
}