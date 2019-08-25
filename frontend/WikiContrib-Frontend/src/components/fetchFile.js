var chunk, chunks, file, uri, method, callback, percent, error;

const fetchFileAsynchronous = (
  csv_file,
  request_method,
  request_url,
  callback_func,
  upload_percent,
  error_callback
) => {
  /**
   * Upload the files to the server through chunked upload.
   * @param {file} csv_file -> file to be uploaded.
   * @param {String} request_method -> HTTP method to perform the request.
   * @param {String} request_url -> URL to be fetched.
   * @param {Object} callback_func -> Call the function on success.
   * @param {Object} upload_percent -> After processing each chunk add the progress.
   * @param {Object} error_callback -> Call the function on error. 
   */
  chunk = 0;
  chunks = 0;
  file = csv_file;
  uri = request_url;
  method = request_method;
  callback = callback_func;
  percent = upload_percent;
  error = error_callback;
  extractChunk('');
};

const extractChunk = response => {
  /**
   * Split the file to get the chunk to be uploaded in next request.
   * @param {Object} response -> Response of the previous request.
   */
  chunk = chunk + 1;
  if (chunk === 1) {
    chunks = Math.ceil(file.size / 1048576);
  }
  if (chunk <= chunks) {
    if (!navigator.onLine) {
      error();
    } else {
      percent(chunk - 1, chunks);
      uploadChunk(response.message);
    }
  } else {
    callback(response);
  }
};

const uploadChunk = hash => {
  /**
   * Upoad the splitted chunk to the server.
   * @param {String} hash -> query hash_code.
   */
  let data = new FormData();
  if (chunk === chunks) {
    data.append('complete', 0);
  } else {
    data.append('complete', -1);
  }
  if (chunk > 1) {
    data.append('hash_code', hash);
  }
  data.append('file', 0);
  data.append('chunk', chunk);
  let begin = (chunk - 1) * 1024 * 1024;
  let csv_file = file.slice(begin, begin + 1024 * 1024);
  data.append('csv_file', csv_file);

  fetch(uri, {
    method: method,
    body: data,
  })
    .then(response => response.json())
    .then(object => {
      extractChunk(object);
    })
    .catch(error => {
      console.log(error);
    });
};

export default fetchFileAsynchronous;
