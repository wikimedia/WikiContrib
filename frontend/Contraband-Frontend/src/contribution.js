import React from "react";
import { Popup, Placeholder } from "semantic-ui-react";
import { months, contribution_color, get_timestamp } from "./Services/api";
import Loading from "./Components/Loading";

const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const monthMap = months.reduce((map, month, index) => {
  console.log(map);
  map[month] = index;
  return map;
}, {});

const GenerateDay = props => {
  let color = "rgb(227, 231, 229)";
  let data = 0;
  const numericMonth = monthMap[props.month];
  try {
    data = props.data[props.year][numericMonth][props.date];
    if (data === undefined) {
      data = 0;
    }
  } catch (TypeError) {
    // perform nothing.
  }

  color = contribution_color(data);
  let month = numericMonth + 1;
  return (
    <div
      className="day"
      style={{ background: color }}
      onClick={() => {
        props.set({
          activity: this.props.year + "-" + month + "-" + this.props.date
        });
        window.scrollTo(0, document.body.scrollHeight);
      }}
    >
      <div className="tooltip">
        {data} {data === 1 ? "Contribution" : "Contributions"}
        on {props.month} {props.date}, {props.year}
      </div>
    </div>
  );
};

const getDays = (year, month) => {
  let day = days[monthMap[month]];
  if (month === "Feb") {
    if (year % 4 === 0) {
      day = 29;
      if (year % 100 === 0 && year % 400 !== 0) {
        day = 28;
      }
    }
  }
  return day;
};

const GenerateMonth = props => {
  let days = getDays(props.year, props.month);
  let items = [];
  for (let i = 1; i < days + 1; i++) {
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
    item.push(
      <GenerateDay
        key={i}
        date={i}
        month={props.month}
        year={props.year}
        data={props.data}
        set={props.set}
      />
    );
    items.push(
      <div className="flex-col" key={i}>
        {item}
      </div>
    );
  }
  return (
    <div style={{ textAlign: "center" }}>
      <span style={{ color: "rgb(80, 82, 81)", paddingLeft: 5, fontSize: 12 }}>
        {props.month}
      </span>
      <div className="flex-row">{items}</div>
    </div>
  );
};

const formatData = data => {
  var rv = {};
  for (let i of data) {
    let temp = 0;
    let date = new Date(parseInt(i.time + "000"));
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

const UserContribution = props => {
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
    let start_month = new Date(this.props.start_time).getMonth();
    let year = new Date(this.props.start_time).getFullYear();
    while (numb_months != 0) {
      render_months.push(
        <GenerateMonth
          month={months[start_month]}
          key={numb_months}
          year={year}
          data={data}
          style={{ display: "inline" }}
          set={this.props.set}
        />
      );

      numb_months -= 1;
      start_month += 1;
      if (start_month % 12 === 0) {
        start_month = 0;
        year = new Date(this.props.end_time).getFullYear();
      }
    }
  }

  return (
    <React.Fragment>
      {!props.loading && (
        <span className="user_contribution_text">
          {props.user} has {props.data.length} Contributions
        </span>
      )}
      <div className="user_activity">
        {this.props.loading ? (
          <Loading count={4} />
        ) : (
          <React.Fragment>
            {render_months.map((obj, ind) => (
              <div className="activity">{obj}</div>
            ))}

            <div
              style={{
                right: "5%",
                position: "absolute"
              }}
            >
              <div>
                <span
                  style={{
                    color: "rgb(80, 82, 81)",
                    marginRight: 5,
                    fontSize: 12
                  }}
                >
                  Less
                </span>
                <div className="day" style={{ display: "inline-block" }} />
                <div
                  className="day"
                  style={{
                    display: "inline-block",
                    background: "rgb(198, 228, 139)"
                  }}
                />
                <div
                  className="day"
                  style={{
                    display: "inline-block",
                    background: "rgb(123, 201, 111)"
                  }}
                />
                <div
                  className="day"
                  style={{
                    display: "inline-block",
                    background: "rgb(35, 154, 59)"
                  }}
                />
                <div
                  className="day"
                  style={{
                    display: "inline-block",
                    background: "rgb(25, 97, 39)"
                  }}
                />
                <span
                  style={{
                    color: "rgb(80, 82, 81)",
                    marginLeft: 5,
                    fontSize: 12
                  }}
                >
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

export default UserContribution;
