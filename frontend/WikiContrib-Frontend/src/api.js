/*
 All the Global Constants are declared here.
*/

const BASE_API_URI = process.env.NODE_ENV === 'production' ?
                     'https://contraband.toolforge.org/'
                  :  'http://127.0.0.1:8000/';

// method: POST
export const QueryCreateApi = BASE_API_URI + 'query/add/user/';
// method: GET, PATCH, DELETE
export const QueryDetailApi = BASE_API_URI + 'query/<hash>/update/user/';
// method: POST
export const filterCreateApi = BASE_API_URI + 'query/<hash>/add/filter/';
// method: GET, PATCH, DELETE
export const filterDetailApi = BASE_API_URI + 'query/<hash>/update/filter/';
// method: POST
export const queryExist = BASE_API_URI + 'query/<hash>/check/';
// method: GET
export const fetchDetails = BASE_API_URI + 'result/<hash>/';

export const getUsers = BASE_API_URI + 'result/<hash>/users/';

export const commits_by_date = BASE_API_URI + 'result/<hash>/commits/';

export const BASE_YEAR = 2013;

export const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'June',
  'July',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
export const full_months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const contributionColors = {
  none: '#efeded',
  level1: '#b1d7ce',
  level2: '#00af89',
  level3: '#14866d',
  level4: '#0a3d32',
};

export const contribution_color = contr => {
  if (contr === 0) {
    return contributionColors.none;
  } else if (contr >= 1 && contr < 3) {
    return contributionColors.level1;
  } else if (contr >= 3 && contr < 5) {
    return contributionColors.level2;
  } else if (contr >= 5 && contr < 7) {
    return contributionColors.level3;
  } else {
    return contributionColors.level4;
  }
};

export const filter_2 = [
  { key: 30, value: 30, text: 'Last 30 days' },
  { key: 60, value: 60, text: 'Last 60 days' },
  { key: 90, value: 90, text: 'Last 90 days' },
  { key: 180, value: 180, text: 'Last 6 months' },
  { key: 365, value: 365, text: 'Last 1 year' },
];

export const zero_pad = value=>value >= 10 ? value : "0" + value;

export const time_delta = days => new Date(days*86400000);

export const getDaysInMonth = (year, month) => {
  /**
   * Caluclate the number of days of a month in an year.
   * @param {Integer} year
   * @param {String} month
   * @returns {Integer} Number of days.
   */
  let day = days[months.indexOf(month)];
  if (month === 'Feb') {
    if (year % 4 === 0) {
      day = 29;
      if (year % 100 === 0 && year % 400 !== 0) {
        day = 28;
      }
    }
  }
  return day;
};

export const get_dates = () => {

  let current_date = new Date();
  let current_year = current_date.getFullYear();
  let current_month = current_date.getMonth();
  let rv = [];

  for (let year = current_year; year >= BASE_YEAR; year--) {
    for (let month = 11; month >= 0; month--) {
      if (year === current_year && month > current_month) {
        continue;
      }

      let iso_string = new Date(`${year}-${zero_pad(month+1)}-${getDaysInMonth(year,months[month])}`);
      iso_string = iso_string.toISOString();
      rv.push({
        key: iso_string,
        value: iso_string,
        text: full_months[month] + ', ' + year,
      });
    }
  }
  return rv;
};


export const get_num_days = (date1, date2) => {
  let days = Math.abs((date2 - date1) / 86400000);

  if (days >= 365) {
    days = 365;
  } else if (days >= 180 && days < 365) {
    days = 180;
  } else if (days >= 89 && days < 180) {
    days = 90;
  } else if (days >= 60 && days < 90) {
    days = 60;
  } else {
    days = 30;
  }
  return days;
};

export const get_num_months = (days) => {
  return days === 30
         ? 1
          : days === 60
            ? 2
            : days === 90
              ? 3
              : days === 180
                ? 6
                : 12;
}

export const UserActivityBreakPoint = () => {
  let width = window.innerWidth;
  if (width >= 1300) {
    return 12;
  } else if (width >= 768) {
    return 6;
  } else if (width >= 576) {
    return 4;
  } else if (width >= 450) {
    return 3;
  } else {
    return 2;
  }
};

export const getPadding = () => {
  let width = window.innerWidth;
  if (width >= 1300) {
    if (width > 1600) {
      return 4;
    } else {
      return Math.ceil(4 - ((1600 - width) / 300) * 4);
    }
  } else if (width >= 768) {
    return Math.ceil(4 - ((1300 - width) / 832) * 4);
  } else if (width >= 576) {
    return Math.ceil(4 - ((768 - width) / 192) * 4);
  } else if (width >= 450) {
    return Math.ceil(4 - ((576 - width) / 126) * 4);
  } else {
    return Math.ceil(4 - ((450 - width) / 400) * 4);
  }
};

export const info_content =
  "WikiContrib tool provides a visualization within a specified time range of users' contributions to Wikimedia projects on Phabricator and Gerrit."
