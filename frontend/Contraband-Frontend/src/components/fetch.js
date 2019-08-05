export const fetchAsynchronous = (uri, method, data, headers, callback) => {
  fetch(uri, {
    method: method,
    body: method === "GET" ? undefined : JSON.stringify(data),
    headers: headers
  })
    .then(response => response.json())
    .then(object => {
      callback(object);
    });
};
