"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function buildRequest(url, requestData) {
  var request = new Request(url, _objectSpread({}, requestData));
  return request;
}

function fetchFromApi(url) {
  var requestData = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    method: 'GET'
  };

  if (!requestData.headers) {
    requestData.headers = {};
  }

  if (!requestData.headers['content-type']) {
    requestData.headers['content-type'] = 'application/json';
  }

  return new Promise(function (resolve, reject) {
    fetch(buildRequest(url, requestData)).then(function (response) {
      // here, we prepare fetch to reject when the status is 4xx or above
      if (response.status >= 400) {
        return reject(response);
      }

      return resolve(response);
    }).catch(function (err) {
      return reject(err);
    });
  });
}

var _default = fetchFromApi;
exports.default = _default;