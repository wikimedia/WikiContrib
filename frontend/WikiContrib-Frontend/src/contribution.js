import React from 'react';
import { Placeholder } from 'semantic-ui-react';
import {
  months,
  contribution_color,
  get_timestamp,
  contributionColors,
  UserActivityBreakPoint,
  getPadding,
} from './api';

const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Generate a Single Day in the User Contribution Activity.
 */
class GenerateDay extends React.Component {
  constructor(props) {
    super(props);
  }

  render = () => {
    let color = 'rgb(227, 231, 229)';
    let data = 0;
    try {
      data = this.props.data[this.props.year][months.indexOf(this.props.month)][
        this.props.date
      ];
      if (data == undefined) {
        data = 0;
      }
    } catch (TypeError) {
      // perform nothing.
    }

    color = contribution_color(data);
    let pad = getPadding();
    let month = months.indexOf(this.props.month) + 1;
    return (
      <div
        className="day"
        style={{ background: color, padding: 6 + pad }}
        onClick={() => {
          this.props.set({
            activity: this.props.year + '-' + month + '-' + this.props.date,
          });
          window.scrollTo(0, document.body.scrollHeight);
        }}
      >
        <div className="tooltip">
          {data} {data === 1 ? 'Contribution' : 'Contributions'}
          on {this.props.month} {this.props.date}, {this.props.year}
        </div>
      </div>
    );
  };
}

/**
 * Generate a Month given in the time span.
 */
class GenerateMonth extends React.Component {
  constructor(props) {
    super(props);
  }

  getDays = (year, month) => {
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

  render = () => {
    let days = this.getDays(this.props.year, this.props.month);
    let items = [];
    for (let i = 1; i <= days; i++) {
      let item = [];

      while (i % 8 != 0 && i <= days) {
        item.push(
          <GenerateDay
            key={i}
            date={i}
            month={this.props.month}
            year={this.props.year}
            data={this.props.data}
            set={this.props.set}
          />
        );
        i++;
      }
      if (days != ((8 * items.length) + item.length)) {
        item.push(
          <GenerateDay
            key={i}
            date={i}
            month={this.props.month}
            year={this.props.year}
            data={this.props.data}
            set={this.props.set}
          />
        );
      }
      items.push(
        <div className="flex-col" key={i}>
          {item}
        </div>
      );
    }
    return (
      <div style={{ textAlign: 'center' }}>
        <span className="contribution_text">
          {this.props.month}
        </span>
        <div className="flex-row">{items}</div>
      </div>
    );
  };
}


/**
 * Display User contributions on each and every day of selected time span.
 */
class UserContribution extends React.Component {
  constructor(props) {
    super(props);
  }

  format = () => {
    /**
     * Format the received data to the proper format.
     * @returns {Object} formatted data.
     */
    var rv = {};
    for (let i of this.props.data) {
      let date = new Date(parseInt(i.time + '000'));
      let year = date.getFullYear();
      if (!(year in rv)) {
        rv[year] = {};
      }
      let month = date.getMonth();
      if (!(month in rv[year])) {
        rv[year][month] = {};
      }
      let day = date.getDate();
      if (!(day in rv[year][month])) {
        rv[year][month][day] = 0;
      }
      rv[year][month][day] += 1;
    }
    return rv;
  };

  render = () => {
    var render_months = [];
    if (!this.props.loading) {
      let data = this.format();
      let approx_days = get_timestamp(
        new Date(this.props.start_time),
        new Date(this.props.end_time)
      );
      let numb_months =
        approx_days == 30
          ? 1
          : approx_days == 60
            ? 2
            : approx_days == 90
              ? 3
              : approx_days == 180
                ? 6
                : 12;
      let start_month = new Date(this.props.end_time).getMonth() - 1;
      let year = new Date(this.props.end_time).getFullYear();
      if (start_month == -1) {
        start_month = 11;
        year -= 1;
      }
      let breakpoint = UserActivityBreakPoint(),
        items = [];
      while (numb_months != 0) {
        if ((numb_months - 1) % breakpoint === 0) {
          items.unshift(
            <GenerateMonth
              month={months[start_month]}
              key={numb_months}
              year={year}
              data={data}
              set={this.props.set}
            />
          );
          render_months.unshift(<div className="flex-row">{items}</div>);
          items = [];
        } else {
          items.unshift(
            <GenerateMonth
              month={months[start_month]}
              key={numb_months}
              year={year}
              data={data}
              set={this.props.set}
            />
          );
        }

        numb_months -= 1;
        start_month -= 1;
        if (start_month === -1) {
          start_month = 11;
          year = new Date(this.props.start_time).getFullYear();
        }
      }
    }

    return (
      <React.Fragment>
        {!this.props.loading ? (
          <span className="user_contribution_text">
            {this.props.data.length}
          </span>
        ) : (
            ''
          )}
        <div className="user_activity">
          {this.props.loading ? (
            <div>
              <Placeholder fluid className="load">
                <Placeholder.Line />
              </Placeholder>
              <Placeholder fluid className="load">
                <Placeholder.Line />
              </Placeholder>
              <Placeholder fluid className="load">
                <Placeholder.Line />
              </Placeholder>
              <Placeholder fluid className="load">
                <Placeholder.Line />
              </Placeholder>
            </div>
          ) : (
              <React.Fragment>
                <div className="render_activity"
                >
                  {render_months}
                </div>
                <div
                  style={{ right: '5%', position: 'absolute' }}
                >
                  <div>
                    <span className="contribution_text">
                      Less
                  </span>
                    <div
                      className="day"
                      style={{
                        padding: 6 + getPadding(),
                        display: 'inline-block',
                        background: contributionColors.none,
                      }}
                    />
                    <div
                      className="day"
                      style={{
                        padding: 6 + getPadding(),
                        display: 'inline-block',
                        background: contributionColors.level1,
                      }}
                    />
                    <div
                      className="day"
                      style={{
                        padding: 6 + getPadding(),
                        display: 'inline-block',
                        background: contributionColors.level2,
                      }}
                    />
                    <div
                      className="day"
                      style={{
                        padding: 6 + getPadding(),
                        display: 'inline-block',
                        background: contributionColors.level3,
                      }}
                    />
                    <span className="contribution_text">
                      More
                  </span>
                  </div>
                </div>
              </React.Fragment>
            )}
        </div>
      </React.Fragment>
    );
  };
}

export default UserContribution;
