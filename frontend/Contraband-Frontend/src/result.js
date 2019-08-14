import React from "react";
import NavBar from "./Components/nav";
import {
  Grid,
  Button,
  Icon,
  Card,
  Popup,
  Dropdown,
  Placeholder,
  Transition
} from "semantic-ui-react";
import { fetchAsynchronous } from "./Components/fetch";
import { Link } from "react-router-dom";
import {
  filter_2,
  get_dates,
  months,
  fetchDetails,
  phab_status,
  gerrit_status,
  format_status,
  full_months,
  get_timestamp,
  filterDetailApi
} from "./Services/api";
import UserSearch from "./Components/dropdown";
import { Line } from "react-chartjs-2";
import UserContribution from "./contribution";
import Activity from "./Components/activity";
import NotFound from "./Components/404";

class DisplayUser extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render = () => (
    <div>
      {this.props.loading ? (
        <React.Fragment>
          <Placeholder>
            <Placeholder.Line />
            <Placeholder.Line />
          </Placeholder>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <h2>{this.props.username}'s Activity</h2>
          <span>
            Gerrit:{" "}
            {this.props.gerrit_username !== "" ? (
              <a
                target="_blank"
                href={
                  "https://gerrit.wikimedia.org/r/#/q/" +
                  this.props.gerrit_username
                }
              >
                {this.props.gerrit_username}
              </a>
            ) : (
              "None"
            )}{" "}
            | Phabricator:{" "}
            {this.props.phabricator_username !== "" ? (
              <a
                target="_blank"
                href={
                  "https://phabricator.wikimedia.org/p/" +
                  this.props.phabricator_username +
                  "/"
                }
              >
                {this.props.phabricator_username}
              </a>
            ) : (
              "None"
            )}
          </span>
        </React.Fragment>
      )}
    </div>
  );
}

class QueryResult extends React.Component {
  constructor(props) {
    super(props);
    let data = false;
    let filters = {
      status: [],
      start_time: "",
      end_time: ""
    };

    if ("data" in this.props.location && this.props.location.data !== "") {
      data = this.props.location.data;
      filters = data.filters;
      filters.status = data.filters.status.split(",");
    }

    this.state = {
      query: this.props.match.params.hash,
      loading: data === false,
      data: data !== false ? data.result : [],
      current: data !== false ? data.current : null,
      prev: data !== false ? data.previous : null,
      next: data !== false ? data.next : null,
      notFound: false,
      value: "",
      activity: undefined,
      current_filters: Object.assign({}, filters),
      update_filters: Object.assign({}, filters),
      page_load: data === false,
      view_filters: false,
      gerrit_username: data !== false ? data.current_gerrit : null,
      phab_username: data !== false ? data.current_phabricator : null
    };
  }

  set = obj => {
    this.setState(obj);
  };

  getGraphData = platform => {
    let data = {};
    if (platform === "phabricator") {
      data = {
        type: "stacked",
        labels: months,
        datasets: [
          {
            label: "Assigned",
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            borderColor: "#cae3e2",
            backgroundColor: "rgb(202, 227, 226, 0.4)",
            lineTension: 0.1
          },
          {
            label: "Owned",
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            borderColor: "#d9cae3",
            backgroundColor: "rgb(217, 202, 227, 0.4)",
            lineTension: 0.1
          },
          {
            label: "All",
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            borderColor: "#bae6b5",
            backgroundColor: "rgb(186, 230, 181, 0.4)",
            lineTension: 0.1
          }
        ]
      };
    } else {
      data = {
        labels: months,
        datasets: [
          {
            label: "Contributions",
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            borderColor: "rgba(75,192,192,1)",
            backgroundColor: "rgba(75,192,192,0.4)",
            lineTension: 0.1
          }
        ]
      };
    }
    this.state.data.forEach(e => {
      let index = new Date(parseInt(e.time) * 1000).getMonth();
      if (platform === "phabricator" && platform in e) {
        if (e.assigned && !e.owned) {
          data.datasets[0].data[index] += 1;
          data.datasets[2].data[index] += 1;
        } else if (e.owned && !e.assigned) {
          data.datasets[1].data[index] += 1;
          data.datasets[2].data[index] += 1;
        } else {
          data.datasets[0].data[index] += 1;
          data.datasets[1].data[index] += 1;
          data.datasets[2].data[index] += 1;
        }
      } else if (platform !== "phabricator" && platform in e) {
        data.datasets[0].data[index] += 1;
      }
    });
    return data;
  };

  callback = response => {
    if (response.error !== 1) {
      let filters = response.filters;
      filters.status = filters.status.split(",");
      this.setState({
        data: response.result,
        current: response.current,
        prev: response.previous,
        gerrit_username: response.current_gerrit,
        phab_username: response.current_phabricator,
        next: response.next,
        loading: false,
        current_filters: filters,
        page_load: false,
        update_filters: filters
      });
    } else {
      this.setState({
        loading: false,
        page_load: false,
        notFound: true
      });
    }
  };

  componentDidMount = () => {
    if (this.state.data.length === 0) {
      this.setState({ loading: true, notFound: false });
      let uri = fetchDetails.replace("<hash>", this.state.query);
      fetchAsynchronous(uri, "GET", {}, {}, this.callback);
    }
  };

  getDetails = username => {
    let uri =
      fetchDetails.replace("<hash>", this.state.query) + "?user=" + username;
    fetchAsynchronous(uri, "GET", {}, {}, this.callback);
    this.setState({
      loading: true,
      activity: undefined,
      value: "",
      notFound: false
    });
  };

  check_filters = () => {
    let { update_filters: uf, current_filters: cf } = this.state;
    if (JSON.stringify(uf) !== JSON.stringify(cf)) {
      let out = {};
      if (uf.status.join(",") !== cf.status.join(",")) {
        out["status"] = uf.status.join(",");
      }
      if (uf.start_time !== cf.start_time) {
        out["start_time"] = uf.start_time;
      }
      if (uf.end_time !== cf.end_time) {
        out["end_time"] = uf.end_time;
      }

      return out;
    }
    return false;
  };

  updatecallback = response => {
    if (response.error != 1) {
      this.setState({
        data: response.result,
        current_filters: this.state.update_filters,
        loading: false
      });
    } else {
      this.setState({
        loading: false,
        notFound: true
      });
    }
  };

  handleSearchClick = () => {
    let data = this.check_filters();
    if (data !== false) {
      data["username"] = this.state.current;
      this.setState({ loading: true, activity: undefined, notFound: false });
      fetchAsynchronous(
        filterDetailApi.replace("<hash>", this.state.query),
        "PATCH",
        data,
        { "Content-Type": "application/json" },
        this.updatecallback
      );
    }
  };

  onUserSearch = obj => {
    this.setState({ value: obj.value, loading: true, notFound: false });
    let uri =
      fetchDetails.replace("<hash>", this.state.query) + "?user=" + obj.value;
    fetchAsynchronous(uri, "GET", {}, {}, this.callback);
  };

  handleReset = () => {
    let time = new Date();
    let month = time.getMonth() + 1;
    let filters = {
      end_time: time.getFullYear() + "-" + month + "-01",
      start_time: time.getFullYear() - 1 + "-" + month + "-01",
      status: phab_status.concat(gerrit_status).concat(["p-open", "g-open"]),
      username: this.state.current
    };
    this.setState({
      loading: true,
      activity: undefined,
      update_filters: Object.assign(filters),
      notFound: false
    });
    let data = Object.assign({}, filters);
    data.status = filters.status.join(",");
    fetchAsynchronous(
      filterDetailApi.replace("<hash>", this.state.query),
      "PATCH",
      data,
      { "Content-Type": "application/json" },
      this.updatecallback
    );
  };

  render = () => {
    document.body.style.backgroundColor = "#ffffff";
    let { update_filters: uf, current_filters: cf } = this.state;
    return (
      <React.Fragment>
        <NavBar display={true} query={this.state.query} />
        {this.state.prev !== null ? (
          <Popup
            content={"Fetch about " + this.state.prev}
            position={"bottom left"}
            trigger={
              <div className="left_arrow">
                <Button
                  icon="arrow left"
                  className="page_button"
                  primary
                  onClick={() => this.getDetails(this.state.prev)}
                  disabled={this.state.loading}
                />
              </div>
            }
          />
        ) : (
          ""
        )}

        {this.state.next !== null ? (
          <div className="right_arrow">
            <Popup
              content={"Fetch about " + this.state.next}
              position={"bottom right"}
              trigger={
                <Button
                  primary
                  className="page_button"
                  icon="arrow right"
                  disabled={this.state.loading}
                  onClick={() => this.getDetails(this.state.next)}
                />
              }
            />
          </div>
        ) : (
          ""
        )}

        <Grid>
          <Grid.Row>
            <Grid.Column width={4} />
            <Grid.Column width={8}>
              <div className="result">
                {this.state.page_load ? (
                  <Placeholder fluid style={{ height: 30, margin: 5 }}>
                    <Placeholder.Line />
                  </Placeholder>
                ) : (
                  <Grid>
                    <Grid.Row>
                      <Grid.Column computer={15} tablet={14} mobile={12}>
                        <UserSearch
                          set={this.onUserSearch}
                          hash={this.state.query}
                          value={this.state.value}
                        />
                      </Grid.Column>
                      <Grid.Column computer={1} tablet={2} mobile={4}>
                        <Popup
                          content="View Filters"
                          position="top center"
                          trigger={
                            <Button
                              icon="options"
                              className="filters"
                              onClick={() =>
                                this.setState({
                                  view_filters: !this.state.view_filters
                                })
                              }
                            />
                          }
                        />
                      </Grid.Column>
                    </Grid.Row>
                  </Grid>
                )}
                <Transition
                  animation="fade down"
                  duration={300}
                  visible={this.state.view_filters}
                >
                  <div className="filter_view">
                    <h4 style={{ textAlign: "center" }}>Query Filters</h4>
                    <Grid>
                      <Grid.Row>
                        <Grid.Column computer={16} tablet={16} mobile={16}>
                          <h5>Status of the commit: </h5>
                          <Dropdown
                            style={{ marginTop: 10 }}
                            fluid
                            search
                            multiple
                            selection
                            options={format_status(
                              gerrit_status.concat(phab_status, "open")
                            )}
                            value={uf.status}
                            onChange={(e, obj) => {
                              let value = obj.value;
                              let filters = Object.assign({}, uf);
                              filters.status = value;
                              this.setState({
                                update_filters: filters
                              });
                            }}
                            placeholder="Status of Commit"
                            closeOnChange={true}
                          />
                        </Grid.Column>
                      </Grid.Row>
                      <Grid.Row>
                        <Grid.Column computer={8} tablet={16} mobile={16}>
                          <h5>From:</h5>
                          <Dropdown
                            style={{ marginTop: 10 }}
                            fluid
                            search
                            selection
                            icon={false}
                            value={
                              full_months[new Date(uf.end_time).getMonth()] +
                              ", " +
                              new Date(uf.end_time).getFullYear()
                            }
                            options={get_dates()}
                            onChange={(e, obj) => {
                              let date = obj.value.split(",");
                              date[1] = date[1].substr(1);
                              date[0] = full_months.indexOf(date[0]) + 1;
                              let filters = Object.assign({}, uf);
                              filters.end_time =
                                date[1] + "-" + date[0] + "-01";
                              let days = get_timestamp(
                                new Date(uf.end_time),
                                new Date(uf.start_time)
                              );
                              let incr =
                                days == 30
                                  ? 1
                                  : days == 60
                                  ? 2
                                  : days == 90
                                  ? 3
                                  : days == 180
                                  ? 6
                                  : 12;

                              let updated_val = new Date(filters.end_time);
                              let start_time = new Date(
                                updated_val.getFullYear(),
                                updated_val.getMonth() - incr,
                                1
                              );
                              let month = start_time.getMonth() + 1;
                              filters.start_time =
                                start_time.getFullYear() + "-" + month + "-01";
                              this.setState({
                                update_filters: filters
                              });
                            }}
                            placeholder="Select Date"
                            closeOnChange={true}
                          />
                        </Grid.Column>
                        <Grid.Column computer={8} tablet={16} mobile={16}>
                          <h5>Time range:</h5>
                          <Dropdown
                            style={{ marginTop: 10 }}
                            fluid
                            search
                            selection
                            icon={false}
                            options={filter_2}
                            value={get_timestamp(
                              new Date(uf.start_time),
                              new Date(uf.end_time)
                            )}
                            onChange={(e, obj) => {
                              let date = new Date(
                                this.state.update_filters.end_time
                              );
                              let value = obj.value;
                              let incr =
                                value <= 31
                                  ? 1
                                  : value <= 61
                                  ? 2
                                  : value <= 92
                                  ? 3
                                  : value <= 183
                                  ? 6
                                  : 12;
                              date = new Date(
                                date.getFullYear(),
                                date.getMonth() - incr,
                                1
                              );
                              let month = date.getMonth() + 1;
                              let filters = Object.assign({}, uf);
                              filters.start_time =
                                date.getFullYear() + "-" + month + "-" + 1;
                              this.setState({ update_filters: filters });
                            }}
                            placeholder="Get by date"
                            closeOnChange={true}
                          />
                        </Grid.Column>
                      </Grid.Row>
                    </Grid>
                    <div style={{ width: "100%" }}>
                      <Button
                        className="reset_filters"
                        onClick={() => this.handleReset()}
                      >
                        Reset
                      </Button>
                      <Button
                        className="apply_filters"
                        onClick={() => this.handleSearchClick()}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </Transition>
              </div>
            </Grid.Column>
            <Grid.Column width={4} />
          </Grid.Row>
          {this.state.notFound ? (
            <NotFound />
          ) : (
            <React.Fragment>
              <Grid.Row>
                <Grid.Column width={4} />
                <Grid.Column width={8}>
                  <DisplayUser
                    loading={this.state.loading}
                    username={this.state.current}
                    gerrit_username={this.state.gerrit_username}
                    phabricator_username={this.state.phab_username}
                  />
                </Grid.Column>
                <Grid.Column width={4} />
              </Grid.Row>
              <Grid.Row>
                <Grid.Column computer={2} mobile={1} tablet={1} />
                <Grid.Column computer={6} mobile={14} tablet={6}>
                  {this.state.loading ? (
                    <Card style={{ marginTop: 10, width: "80%" }}>
                      <Card.Content>
                        <Placeholder>
                          <Placeholder.Image rectangular />
                        </Placeholder>
                      </Card.Content>
                    </Card>
                  ) : (
                    <Card style={{ width: "100%", marginTop: 10 }}>
                      <span style={{ textAlign: "center" }}>
                        <b>Phabricator </b>
                        <Line
                          ref="chart"
                          data={this.getGraphData("phabricator")}
                        />
                      </span>
                    </Card>
                  )}
                </Grid.Column>
                <Grid.Column computer={6} mobile={14} tablet={6}>
                  {this.state.loading ? (
                    <Card style={{ marginTop: 10, width: "80%" }}>
                      <Card.Content>
                        <Placeholder>
                          <Placeholder.Image rectangular />
                        </Placeholder>
                      </Card.Content>
                    </Card>
                  ) : (
                    <Card style={{ width: "100%", marginTop: 10 }}>
                      <span style={{ textAlign: "center" }}>
                        <b>Gerrit </b>
                        <Line ref="chart" data={this.getGraphData("gerrit")} />
                      </span>
                    </Card>
                  )}
                </Grid.Column>
                <Grid.Column computer={2} mobile={1} tablet={1} />
              </Grid.Row>
              <Grid.Row>
                <Grid.Column width={2} />
                <Grid.Column width={12}>
                  <UserContribution
                    start_time={cf.start_time}
                    end_time={cf.end_time}
                    user={this.state.current}
                    data={this.state.data}
                    set={this.set}
                    loading={this.state.loading}
                  />
                </Grid.Column>
                <Grid.Column width={2} />
              </Grid.Row>
              {this.state.activity !== undefined ? (
                <Grid.Row>
                  <Grid.Column width={3} />
                  <Grid.Column width={9}>
                    <Activity
                      date={this.state.activity}
                      hash={this.state.query}
                      username={this.state.current}
                    />
                  </Grid.Column>
                  <Grid.Column width={3} />
                </Grid.Row>
              ) : (
                ""
              )}
            </React.Fragment>
          )}
        </Grid>
      </React.Fragment>
    );
  };
}

export default QueryResult;
