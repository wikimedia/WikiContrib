import React from 'react';
import { Placeholder } from 'semantic-ui-react';
import {
  months,
  getDaysInMonth,
  contribution_color,
  get_num_days,
  get_num_months,
  contributionColors,
  getPadding,
} from './api';
/**
 * Generate a Single Day in the User Contribution Activity.
 */
class GenerateDay extends React.Component {
  render = () => {
    let color = 'rgb(227, 231, 229)';
    let data = [];
    try {
      data = this.props.data[this.props.year][months.indexOf(this.props.month)][
        this.props.date
      ];

      if (data === undefined) {
        data = [];
      }
    } catch (TypeError) {
      // perform nothing.
    }

    color = contribution_color(data.length);
    let pad = getPadding();
    return (
      <div
        className="day"
        style={{ background: color, padding: 6 + pad }}
        onClick={() => {
          this.props.set({
            activity: data.toString(),
          });
          window.scrollTo(0, document.body.scrollHeight);
        }}
      >
        <div className="tooltip">
          {data.length} {data.length === 1 ? 'Contribution' : 'Contributions'}
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

  render = () => {
    let days = getDaysInMonth(this.props.year, this.props.month);
    let items = [];
    for (let i = 1; i <= days; i++) {
      let item = [];

      while (i % 8 !== 0 && i <= days) {
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
      if (days !== 8 * items.length + item.length) {
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
        <span className="contribution_text">{this.props.month}</span>
        <div className="flex-row">{items}</div>
      </div>
    );
  };
}

/**
 * Display User contributions on each and every day of selected time span.
 */
class UserContribution extends React.Component {
  format = () => {
    /**
     * Format the received data to the proper format.
     * @returns {Object} formatted data.
     */
    var rv = {};
    for (let i of this.props.data) {
      let date = new Date(i.time);
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
        rv[year][month][day] = [];
      }
      rv[year][month][day].push(i.time);
    }

    return rv;
  };

  render = () => {
    var render_months = [];
    if (!this.props.loading) {
      let data = this.format();
      let approx_days = get_num_days(
        new Date(this.props.start_time),
        new Date(this.props.end_time)
      );

      let numb_months = get_num_months(approx_days);
      let count_month = numb_months + 1;

      let shouldNotRemoveFirstMonthInArr = true,
      year = new Date(this.props.end_time),
      end_month = year.getMonth();
      year = year.getFullYear();

      while (count_month > 0) {

        try{

          //########### decide if we should remove the first month in render_months or not #########
          shouldNotRemoveFirstMonthInArr = count_month !== 1 && render_months.length !== numb_months;

          let monthHasContribution = Object.getOwnPropertyNames(data[year][end_month]).length !== 0;

          shouldNotRemoveFirstMonthInArr = shouldNotRemoveFirstMonthInArr || monthHasContribution;
          //######################################################################################

        }catch{
          // Do nothing
        }

        if(shouldNotRemoveFirstMonthInArr){
          render_months.unshift(
            <GenerateMonth
              month={months[end_month]}
              key={count_month}
              year={year}
              data={data}
              set={this.props.set}
            />
          );
        }

        count_month -= 1;
        end_month -= 1;
        if (end_month === -1) {
          end_month = 11;
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
              <div className="render_activity">{render_months}</div>
              <div style={{ right: '5%', position: 'absolute' }}>
                <div>
                  <span className="contribution_text">Less</span>
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
                  <span className="contribution_text">More</span>
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
