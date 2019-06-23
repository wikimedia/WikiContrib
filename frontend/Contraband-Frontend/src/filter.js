import React, { Component } from "react";
import Stepper from "./components/stepper";
import MessageDisplay from "./components/message";
import DateTimeClass from "./components/datetime";
import { fetchAsynchronous } from "./components/fetch";
import { filterCreateApi, queryExist, filterDetailApi } from "./api.js";
import { Redirect } from "react-router-dom";
import moment from "moment";
import {
  Grid,
  Card,
  Button,
  Icon,
  Popup,
  Input,
  Placeholder
} from "semantic-ui-react";

export class filter extends Component {
  constructor(props) {
    super(props);
    let type =
      this.props.location.pathname.split("/")[3] === "add" ? true : false;
    this.state = {
      message: {
        message: "",
        type: "",
        update: false,
        trigger: false
      },
      open_start: false,
      open_end: false,
      start_date: "",
      end_date: "",
      project: "",
      status: "",
      loading: false,
      redirect: false,
      progress: true,
      notFound: false,
      operation: type
    };
  }

  set = obj => {
    if (this.state.start_date !== "" && obj.hasOwnProperty("end_date")) {
      if (new Date(this.state.start_date) > new Date(obj.end_date)) {
        this.setState({
          message: {
            message: "Start date can not be prior to end date.",
            trigger: true,
            type: 1,
            update: !this.state.message.update
          },
          open_end: false
        });
        return 0;
      }
    }

    if (this.state.end_date !== "" && obj.hasOwnProperty("start_date")) {
      if (new Date(this.state.end_date) < new Date(obj.start_date)) {
        this.setState({
          message: {
            message: "Start date can not be prior to end date.",
            trigger: true,
            type: 1,
            update: !this.state.message.update
          },
          open_start: false
        });
        return 0;
      }
    }
    this.setState(obj);
  };

  componentDidMount = () => {
    if (!this.state.operation) {
      this.getQueryFilters();
    } else {
      this.checkQueryExist();
    }

    window.addEventListener("click", e => {
      if (e.target.id !== "start_date_input") {
        let elem = document.getElementById("datetime_start");
        if (elem !== null) {
          if (!elem.contains(e.target)) {
            this.setState({ open_start: false });
          }
        }
      }

      if (e.target.id !== "end_date_input") {
        let elem = document.getElementById("datetime_end");
        if (elem !== null) {
          if (!elem.contains(e.target)) {
            this.setState({ open_end: false });
          }
        }
      }
    });
  };

  /*
   * The function performs two operations:
   * 1. Checks if the Query exists.
   * 2. Checks if Query filter exists.
   */
  checkQueryExist = () => {
    fetchAsynchronous(
      queryExist.replace("<hash>", this.props.match.params.hash),
      "POST",
      {},
      {},
      this.checkValid
    );
  };

  componentDidUpdate = (prevProps, prevState) => {
    if (prevProps.location.pathname !== this.props.location.pathname) {
      this.setState(
        {
          operation:
            this.props.location.pathname.split("/")[3] === "add" ? true : false
        },
        () => {
          if (this.state.operation) {
            this.checkQueryExist();
          } else {
            this.getQueryFilters();
          }
        }
      );
    }
  };

  checkValid = response => {
    if (response.query) {
      if (response.filter) {
        this.setState({
          notFound: false,
          redirect: "/" + this.props.match.params.hash + "/filters/update/"
        });
      } else {
        this.setState({ notFound: false, progress: false });
      }
    } else {
      this.setState({ notFound: true, progress: false });
    }
  };

  getQueryFilters = () => {
    fetchAsynchronous(
      filterDetailApi.replace("<hash>", this.props.match.params.hash),
      "GET",
      undefined,
      {},
      this.getQueryFilterCallback
    );
  };

  getQueryFilterCallback = response => {
    if (response.hasOwnProperty("error") && response.error === 1) {
      this.setState({ redirect: "/404/" });
    } else {
      this.setState({
        project: response.project,
        status: response.status,
        start_date: response.start_time,
        end_date: response.end_time,
        progress: false
      });
    }
  };

  addFilter = () => {
    this.setState({ loading: true });
    let data = {
      start_time:
        this.state.start_date !== ""
          ? moment(this.state.start_date).utc()._d
          : null,
      end_time:
        this.state.end_date !== ""
          ? moment(this.state.end_date).utc()._d
          : null,
      project: this.state.project,
      status: this.state.status
    };
    let uri = filterCreateApi.replace("<hash>", this.props.match.params.hash);
    if (!this.state.operation) {
      uri = filterDetailApi.replace("<hash>", this.props.match.params.hash);
    }
    fetchAsynchronous(
      uri,
      this.state.operation ? "POST" : "PATCH",
      data,
      { "Content-Type": "application/json" },
      this.callback
    );
  };

  callback = response => {
    if (response.error === 1) {
      this.setState({
        message: {
          message: response.message,
          update: !this.state.message.update,
          trigger: true,
          type: 1
        },
        loading: false
      });
    } else {
      this.setState({
        loading: false,
        redirect: "/" + this.props.match.params.hash + "/"
      });
    }
  };

  render = () => (
    <React.Fragment>
      {this.state.redirect ? <Redirect to={this.state.redirect} /> : ""}
      {this.state.notFound ? <Redirect to="/404/" /> : ""}
      <Stepper step={2} />
      <MessageDisplay
        message={this.state.message.message}
        type={this.state.message.type}
        update={this.state.message.update}
        trigger={this.state.message.trigger}
      />
      <Grid>
        <Grid.Row>
          <Grid.Column computer={3} tablet={1} mobile={1} />
          <Grid.Column computer={10} tablet={14} mobile={14}>
            {this.state.progress ? (
              <Card
                style={{ width: "100%", padding: 10, background: "#f3f3f3" }}
              >
                <Grid>
                  <Grid.Row>
                    <Grid.Column width={5} />
                    <Grid.Column width={6}>
                      <Placeholder style={{ height: 20, margin: 10 }}>
                        <Placeholder.Line className="placeholder_line" />
                      </Placeholder>
                    </Grid.Column>
                    <Grid.Column width={5} />

                    <Grid.Column computer={8} tablet={14} mobile={14}>
                      <Placeholder style={{ height: 25, margin: 10 }}>
                        <Placeholder.Line className="placeholder_line" />
                      </Placeholder>
                    </Grid.Column>
                    <Grid.Column computer={8} tablet={14} mobile={14}>
                      <Placeholder style={{ height: 25, margin: 10 }}>
                        <Placeholder.Line className="placeholder_line" />
                      </Placeholder>
                    </Grid.Column>
                    <Grid.Column computer={8} tablet={14} mobile={14}>
                      <Placeholder style={{ height: 25, margin: 10 }}>
                        <Placeholder.Line className="placeholder_line" />
                      </Placeholder>
                    </Grid.Column>
                    <Grid.Column computer={8} tablet={14} mobile={14}>
                      <Placeholder style={{ height: 25, margin: 10 }}>
                        <Placeholder.Line className="placeholder_line" />
                      </Placeholder>
                    </Grid.Column>
                    <Grid.Column width={16}>
                      <div className="divide" />
                    </Grid.Column>
                    <Grid.Column width={16}>
                      <Placeholder fluid style={{ height: 20, margin: 10 }}>
                        <Placeholder.Line className="placeholder_line" />
                      </Placeholder>
                    </Grid.Column>
                  </Grid.Row>
                </Grid>
              </Card>
            ) : (
              <Card className="query_add_filter">
                <div>
                  <div style={{ textAlign: "center" }}>
                    <h4 style={{ display: "inline" }}>Add advanced filter</h4>

                    <Popup
                      content={
                        <div>
                          <h4>Filter Query</h4> You can filter and get more
                          specific results based on some params.
                        </div>
                      }
                      on="click"
                      pinned
                      position="bottom center"
                      trigger={
                        <Icon
                          name="info circle"
                          size="large"
                          style={{
                            cursor: "pointer",
                            float: "right",
                            color: "white"
                          }}
                        />
                      }
                    />

                    <Grid style={{ marginTop: 10 }}>
                      <Grid.Row>
                        <Grid.Column computer={8} tablet={14} mobile={14}>
                          <Popup
                            on="focus"
                            content={
                              <div id="datetime_start">
                                <DateTimeClass set={this.set} type="start" />
                              </div>
                            }
                            open={this.state.open_start}
                            pinned
                            position="bottom center"
                            trigger={
                              <Input
                                className="filter_input"
                                label="Start TimeStamp"
                                icon="calendar"
                                id="start_date_input"
                                value={this.state.start_date}
                                onChange={e =>
                                  this.setState({
                                    start_date: e.target.value
                                  })
                                }
                                onFocus={() =>
                                  this.setState({ open_start: true })
                                }
                                placeholder="YYYY-MM-DD HH:MM"
                              />
                            }
                          />
                        </Grid.Column>
                        <Grid.Column computer={8} tablet={14} mobile={14}>
                          <Popup
                            on="focus"
                            content={
                              <div id="datetime_end">
                                <DateTimeClass set={this.set} type="end" />
                              </div>
                            }
                            open={this.state.open_end}
                            pinned
                            position="bottom center"
                            trigger={
                              <Input
                                className="filter_input"
                                label="End TimeStamp"
                                icon="calendar"
                                id="end_date_input"
                                placeholder="YYYY-MM-DD HH:MM"
                                value={this.state.end_date}
                                onChange={e =>
                                  this.setState({ end_date: e.target.value })
                                }
                                onFocus={() =>
                                  this.setState({ open_end: true })
                                }
                              />
                            }
                          />
                        </Grid.Column>
                        <Grid.Column computer={8} tablet={14} mobile={14}>
                          <Input
                            className="filter_input"
                            id="status_input"
                            icon="code branch"
                            iconPosition="left"
                            value={this.state.status}
                            onChange={e =>
                              this.setState({ status: e.target.value })
                            }
                            placeholder="Status of the commits"
                          />
                        </Grid.Column>
                        <Grid.Column computer={8} tablet={14} mobile={14}>
                          <Input
                            className="filter_input"
                            id="project_input"
                            icon="users"
                            value={this.state.project}
                            onChange={e =>
                              this.setState({ project: e.target.value })
                            }
                            iconPosition="left"
                            placeholder="Project of Commits"
                          />
                        </Grid.Column>
                      </Grid.Row>
                    </Grid>
                  </div>

                  <div className="divide" />
                  <div>
                    <Button
                      icon
                      onClick={() =>
                        this.setState({
                          redirect:
                            "/query/" +
                            this.props.match.params.hash +
                            "/update/"
                        })
                      }
                    >
                      <Icon
                        name="chevron circle left"
                        style={{ marginLeft: 2 }}
                      />
                    </Button>
                    <Button
                      onClick={this.addFilter}
                      style={{
                        padding: 10,
                        float: "right"
                      }}
                      loading={this.state.loading}
                    >
                      Search
                      <Icon name="search" style={{ marginLeft: 2 }} />
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </Grid.Column>
          <Grid.Column computer={3} tablet={1} mobile={1} />
        </Grid.Row>
      </Grid>
    </React.Fragment>
  );
}

export class filterUpdate extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render = () => <React.Fragment>update filters</React.Fragment>;
}

export class filterDelete extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render = () => <React.Fragment>delete filters</React.Fragment>;
}

export class filterView extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render = () => <React.Fragment> view filters</React.Fragment>;
}
