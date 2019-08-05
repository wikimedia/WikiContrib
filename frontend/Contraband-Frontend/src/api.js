/*
 All the Global Constants are declared here.
*/

const BASE_API_URI = "https://tools.wmflabs.org/contraband/";
// const BASE_API_URI = "http://127.0.0.1:8000/";

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

// method: GET
export const fetchDetails = BASE_API_URI + "result/<hash>/";

export const searchUsers = BASE_API_URI + "result/<hash>/users/";

export const commits_by_date = BASE_API_URI + "result/<hash>/commits/";

export const BASE_YEAR = "2010";
export const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "June",
  "July",
  "Aug",
  "Sep",
  "Oct",
  "nov",
  "Dec"
];

export const contribution_color = contr => {
  if (contr === 0) {
    return "rgb(227, 231, 229)";
  } else if (contr >= 1 && contr < 3) {
    return "rgb(198, 228, 139)";
  } else if (contr >= 3 && contr < 5) {
    return "rgb(123, 201, 111)";
  } else if (contr >= 5 && contr < 7) {
    return "rgb(35, 154, 59)";
  } else {
    return "rgb(25, 97, 39)";
  }
};

export const filter_2 = [
  { key: 30, value: 30, text: "Last 30 days" },
  { key: 60, value: 60, text: "Last 60 days" },
  { key: 90, value: 90, text: "Last 90 days" },
  { key: 183, value: 183, text: "Last 6 months" },
  { key: 365, value: 365, text: "Last 1 year" }
];

export const filter_3 = [
  { key: "merged", value: "merged", text: "Gerrit, Merged" },
  { key: "abandoned", value: "abandoned", text: "Phabricator, Abandoned" },
  { key: "resolved", value: "resolved", text: "Phabricator, Resolved" }
];

export const filter_1 = [
  { key: "merged", value: "merged", text: "June, 2019" },
  { key: "abandoned", value: "abandoned", text: "May, 2019" },
  { key: "resolved", value: "resolveasd", text: "April, 2019" },
  { key: "resolve", value: "resolveasdd", text: "March, 2019" },
  { key: "resolvd", value: "resolveasdd", text: "Feberuary, 2019" },
  { key: "resoed", value: "resolvasded", text: "January, 2019" },
  { key: "rlved", value: "resolvqweed", text: "December, 2018" },
  { key: "rsolved", value: "resolvssed", text: "November, 2018" },
  { key: "res", value: "resolveqwed", text: "October, 2018" },
  { key: "resqolved", value: "resolweved", text: "September, 2018" },
  { key: "resoadlved", value: "resowlved", text: "August, 2018" },
  { key: "resolvasded", value: "rqwesolved", text: "July, 2018" },
  { key: "resolvasdesd", value: "rqwesolved", text: "June, 2018" },
  { key: "resolvasdsed", value: "rsqwesolved", text: "May, 2018" }
];

export const data = {
  labels: ["a", "b", "c", "d", "e"],
  datasets: [
    {
      stack: "stack1",
      label: "data1",
      data: [1, 2, 3, 4, 5]
    },
    {
      stack: "stack1",
      label: "data2",
      data: [5, 4, 3, 2, 1]
    }
  ]
};
