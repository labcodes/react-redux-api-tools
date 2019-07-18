function buildRequest(url, requestData) {
  const request = new Request(url, { ...requestData });
  return request;
}

function fetchFromApi(url, requestData = { method: 'GET' }) {
  if (!requestData.headers) {
    requestData.headers = {};
  }

  if (!requestData.headers['content-type']) {
    requestData.headers['content-type'] = 'application/json';
  }

  return new Promise((resolve, reject) => {
    fetch(buildRequest(url, requestData))
      .then(response => {
        // here, we prepare fetch to reject when the status is 4xx or above
        if (response.status >= 400) {
          return reject(response);
        }
        return resolve(response);
      })
      .catch(err => reject(err));
  });
}

export default fetchFromApi;
