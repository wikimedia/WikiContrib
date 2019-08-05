import React from "react";
import NavBar from "./components/nav";
import {
  Grid,
  Button,
  Icon,
  Card,
  Popup,
  Dropdown,
  Placeholder
} from "semantic-ui-react";
import { fetchAsynchronous } from "./components/fetch";
import { Link } from "react-router-dom";
import {
  filter_2,
  filter_3,
  data,
  filter_1,
  months,
  fetchDetails
} from "./api";
import UserSearch from "./components/dropdown";
import { Line } from "react-chartjs-2";
import UserContribution from "./contribution";
import Activity from "./components/activity";

class QueryResult extends React.Component {
  constructor(props) {
    super(props);
    let data = false;
    if ("data" in this.props.location) {
      data = this.props.location.data;
    }

    this.state = {
      query: this.props.match.params.hash,
      loading: data !== false,
      data: data !== false ? data.result : [],
      current: data !== false ? data.current : null,
      prev: data !== false ? data.previous : null,
      next: data !== false ? data.next : null,
      notFound: false,
      search: "",
      activity: undefined
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
      this.setState({
        data: response.result,
        current: response.current,
        prev: response.previous,
        next: response.next,
        loading: false
      });
    } else {
      this.setState({
        loading: false,
        notFound: true
      });
    }
  };

  componentDidMount = () => {
    if (this.state.data === undefined || this.state.data.length === 0) {
      this.setState({ loading: true });
      let uri = fetchDetails.replace("<hash>", this.state.query);
      fetchAsynchronous(uri, "GET", {}, {}, this.callback);
    }
  };

  getDetails = username => {
    let uri =
      fetchDetails.replace("<hash>", this.state.query) + "?user=" + username;
    fetchAsynchronous(uri, "GET", {}, {}, this.callback);
    this.setState({ loading: true, activity: undefined });
  };

  render = () => {
    document.body.style.backgroundColor = "#ffffff";
    return (
      <React.Fragment>
        <NavBar />
        <Grid>
          <Grid.Row style={{ textAlign: "center" }}>
            <Grid.Column width={2}>
              {this.state.prev !== null ? (
                <Popup
                  content={"Fetch about " + this.state.prev}
                  position={"bottom left"}
                  trigger={
                    <Button
                      icon="arrow left"
                      primary
                      onClick={() => this.getDetails(this.state.prev)}
                      disabled={this.state.loading}
                    />
                  }
                />
              ) : (
                ""
              )}
            </Grid.Column>
            <Grid.Column width={12} />
            <Grid.Column width={2}>
              {this.state.next !== null ? (
                <Popup
                  content={"Fetch about " + this.state.next}
                  position={"bottom right"}
                  trigger={
                    <Button
                      primary
                      icon="arrow right"
                      disabled={this.state.loading}
                      onClick={() => this.getDetails(this.state.next)}
                    />
                  }
                />
              ) : (
                ""
              )}
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={12} />
            <Grid.Column width={4}>
              <Popup
                content={"Update the query"}
                position={"bottom center"}
                trigger={
                  <Button
                    primary
                    as={Link}
                    to={"/query/" + this.state.query + "/update/"}
                  >
                    <Icon name="redo" />
                    Update
                  </Button>
                }
              />
              <Popup
                content={"Create new query"}
                position={"bottom center"}
                trigger={
                  <Button primary as={Link} to="/">
                    <Icon name="plus circle" />
                    New
                  </Button>
                }
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={4} />
            <Grid.Column width={8}>
              <div className="result">
                <div className="search">
                  <UserSearch set={this.set} hash={this.state.query} />
                  <Button icon="search" primary />
                </div>
                <br />
                <Grid>
                  <Grid.Row>
                    <Grid.Column computer={5} tablet={16} mobile={16}>
                      <Dropdown
                        style={{ marginTop: 10 }}
                        fluid
                        search
                        selection
                        icon={false}
                        options={filter_1}
                        placeholder="Select Date"
                        closeOnChange={true}
                      />
                    </Grid.Column>
                    <Grid.Column computer={5} tablet={16} mobile={16}>
                      <Dropdown
                        style={{ marginTop: 10 }}
                        fluid
                        search
                        selection
                        icon={false}
                        options={filter_2}
                        placeholder="Get by date"
                        closeOnChange={true}
                      />
                    </Grid.Column>
                    <Grid.Column computer={6} tablet={16} mobile={16}>
                      <Dropdown
                        style={{ marginTop: 10 }}
                        fluid
                        search
                        multiple
                        selection
                        options={filter_3}
                        placeholder="Status of commit"
                        closeOnChange={true}
                      />
                    </Grid.Column>
                  </Grid.Row>
                </Grid>
              </div>
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
                    <Line ref="chart" data={this.getGraphData("phabricator")} />
                  </span>
                </Card>
              )}
            </Grid.Column>
            <Grid.Column computer={1} mobile={1} tablet={1} />

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
            <Grid.Column computer={1} mobile={1} tablet={1} />
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={2} />
            <Grid.Column width={12}>
              <UserContribution
                start_year={2018}
                start_month={7}
                end_year={2019}
                end_month={6}
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
        </Grid>
      </React.Fragment>
    );
  };
}

export default QueryResult;
