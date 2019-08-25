export const fetchAsynchronous = (uri, method, data, headers, callback) => {
  /**
   * Fetches the API and return the response to the callback.
   * @param {String} uri -> URL to be feched.
   * @param {String} method -> HTTP method in which the URL is to be fetched.
   * @param {Object} data -> JSON data to be passed in the request.
   * @param {Object} Headers -> HTTP Request headers for the request.
   * @param {Object} callback -> Callback function to send the response.
   */
  fetch(uri, {
    method: method,
    body: method === 'GET' ? undefined : JSON.stringify(data),
    headers: headers,
  })
    .then(response => response.json())
    .then(object => {
      callback(object);
    });
};
