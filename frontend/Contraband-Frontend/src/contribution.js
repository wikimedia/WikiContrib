import React from "react";
import { Popup, Placeholder } from "semantic-ui-react";
import { months, contribution_color } from "./api";

const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

class GenerateDay extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render = () => {
    let color = "rgb(227, 231, 229)";
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
    let month = months.indexOf(this.props.month) + 1;
    return (
      <div
        className="day"
        style={{ background: color }}
        onClick={() => {
          this.props.set({
            activity: this.props.year + "-" + month + "-" + this.props.date
          });
          window.scrollTo(0, document.body.scrollHeight);
        }}
      >
        <div className="tooltip">
          {data} {data === 1 ? "Contribution" : "Contributions"}
          on {this.props.month} {this.props.date}, {this.props.year}
        </div>
      </div>
    );
  };
}

class GenerateMonth extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  getDays = (year, month) => {
    let day = days[months.indexOf(month)];
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

  render = () => {
    let days = this.getDays(this.props.year, this.props.month);
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
          month={this.props.month}
          year={this.props.year}
          data={this.props.data}
          set={this.props.set}
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
        <span
          style={{ color: "rgb(80, 82, 81)", paddingLeft: 5, fontSize: 12 }}
        >
          {this.props.month}
        </span>
        <div className="flex-row">{items}</div>
      </div>
    );
  };
}

class UserContribution extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  format = () => {
    var rv = {};
    for (let i of this.props.data) {
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

  render = () => {
    let data = this.format();
    return (
      <React.Fragment>
        {!this.props.loading ? (
          <span className="user_contribution_text">
            {this.props.user} has {this.props.data.length} Contributions
          </span>
        ) : (
          ""
        )}
        <div className="user_activity">
          {this.props.loading ? (
            <div>
              <Placeholder fluid style={{ height: 30, margin: 5 }}>
                <Placeholder.Line />
              </Placeholder>
              <Placeholder fluid style={{ height: 30, margin: 5 }}>
                <Placeholder.Line />
              </Placeholder>
              <Placeholder fluid style={{ height: 30, margin: 5 }}>
                <Placeholder.Line />
              </Placeholder>
              <Placeholder fluid style={{ height: 30, margin: 5 }}>
                <Placeholder.Line />
              </Placeholder>
            </div>
          ) : (
            <React.Fragment>
              {months.map((obj, index) => (
                <React.Fragment key={index}>
                  {this.props.start_month <= index ? (
                    <div className="activity">
                      <GenerateMonth
                        month={obj}
                        year={this.props.start_year}
                        data={data}
                        set={this.props.set}
                      />
                    </div>
                  ) : (
                    ""
                  )}
                </React.Fragment>
              ))}
              {months.map((obj, index) => (
                <React.Fragment key={index}>
                  {this.props.end_month >= index ? (
                    <div className="activity">
                      <GenerateMonth
                        month={obj}
                        year={this.props.end_year}
                        data={data}
                        set={this.props.set}
                      />
                    </div>
                  ) : (
                    ""
                  )}
                </React.Fragment>
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
}

export default UserContribution;
