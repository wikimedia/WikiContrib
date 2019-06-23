/*
 All the Global Constants are declared here.
*/

const BASE_API_URI = "http://127.0.0.1:8000/";

// method: POST
export const QueryCreateApi = BASE_API_URI + "query/add/user/";
// method: GET, PATCH, DELETE
export const QueryDetailApi = BASE_API_URI + "query/<hash>/update/user/";
// method: POST
export const filterCreateApi = BASE_API_URI + "query/<hash>/add/filter/";
// method: GET, PATCH, DELETE
export const filterDetailApi = BASE_API_URI + "query/<hash>/update/filter/";
// method: POST
export const queryExist = BASE_API_URI + "query/<hash>/check/";
