var chunk, chunks, file, uri, method, callback, percent, error, _set;

const fetchFileAsynchronous = (
  csv_file,
  request_method,
  request_url,
  callback_func,
  upload_percent,
  error_callback,
  set
) => {
  chunk = 0;
  chunks = 0;
  file = csv_file;
  uri = request_url;
  method = request_method;
  callback = callback_func;
  percent = upload_percent;
  error = error_callback;
  _set = set;
  extractChunk("");
};

const extractChunk = response => {
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
  let data = new FormData();
  if (chunk === chunks) {
    data.append("complete", 0);
    _set({ loadData: true });
  } else {
    data.append("complete", -1);
  }
  if (chunk > 1) {
    data.append("hash_code", hash);
  }
  data.append("file", 0);
  data.append("chunk", chunk);
  let begin = (chunk - 1) * 1024 * 1024;
  let csv_file = file.slice(begin, begin + 1024 * 1024);
  data.append("csv_file", csv_file);

  fetch(uri, {
    method: method,
    body: data
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
