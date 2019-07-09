
export function fetchFromApi(url, init={ method: 'GET' }) {

  return new Promise((resolve, reject) => {

    fetch(buildRequest(url, init))
      .then(response => {

        // here, we prepare fetch to reject when the status is 4xx or above
        if (response.status >= 400){
          return reject(response)
        }
        return resolve(response);

      }).catch(err => reject(err));

  });

}

export function buildRequest(url, init) {
  const request = new Request(url, { ...init });
  return request;
}
