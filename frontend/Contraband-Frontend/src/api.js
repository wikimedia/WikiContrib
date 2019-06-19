/*
 All the Global Constants are declared here.
*/

const BASE_API_URI = "http://tools.wmflabs.org/contraband/";

// method: POST
export const QueryCreate = BASE_API_URI + "/query/add/user/";
// method: GET, PATCH, DELETE
export const QueryDetail = BASE_API_URI + "query/<hash>/update/user/";
// method: POST
export const filterCreate = BASE_API_URI + "query/<hash>/add/filter/";
// method: GET, PATCH, DELETE
export const filterDetail = BASE_API_URI + "query/<hash>/update/filter/";
