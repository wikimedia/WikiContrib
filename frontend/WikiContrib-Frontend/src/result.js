import React from 'react';
import {
  Grid,
  Button,
  Card,
  Popup,
  Dropdown,
  Placeholder,
  Transition,
  Header,
} from 'semantic-ui-react';
import { fetchAsynchronous } from './components/fetch';
import { Link } from 'react-router-dom';
import {
  filter_2,
  get_dates,
  months,
  fetchDetails,
  full_months,
  get_timestamp,
  filterDetailApi,
} from './api';
import UserSearch from './components/dropdown';
import { Line } from 'react-chartjs-2';
import UserContribution from './contribution';
import Activity from './components/activity';
import NotFound from './components/404';
import { tool_name } from './App';
import { NavBar } from './components/nav';

/**
 * Styles to the Line Graphs.
 */
const chartOptions = {
  legend: {
    position: 'top',
  },
  scales: {
    xAxes: [
      {
        gridLines: {
          display: true,
        },
        ticks: {
          fontSize: 15,
        },
      },
    ],
    yAxes: [
      {
        gridLines: {
          display: true,
        },
        ticks: {
          fontSize: 15,
          beginAtZero: true,
          callback: function(value) {
            if (Number.isInteger(value)) {
              return value;
            }
          },
        },
        display: true,
      },
    ],
  },
};

/**
 * Display Fullname, Phabricator Username and Gerrit Username of the user.
 */
class DisplayUser extends React.Component {
  render = () => {
    let { start_time: st, end_time: et } = this.props.filters;
    st = new Date(st),
    st_m = st.getUTCMonth(),
    et = new Date(et),
    et_m = et.getUTCMonth();
    return (
      <div>
        {this.props.loading ? (
          <React.Fragment>
            <Placeholder>
              <Placeholder.Line className="load_background" />
              <Placeholder.Line className="load_background" />
            </Placeholder>
          </React.Fragment>
        ) : (
            <React.Fragment>
              <Header><h2 className="name">{this.props.username}'s Activity</h2></Header>
              <span>
                <h3 className="accounts">
                  Gerrit:{' '}
                  {this.props.gerrit_username !== '' ? (
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={
                        'https://gerrit.wikimedia.org/r/#/q/' +
                        this.props.gerrit_username
                      }
                    >
                      {this.props.gerrit_username}
                    </a>
                  ) : (
                      'None'
                    )}{' '}
                  | Phabricator:{' '}
                  {this.props.phabricator_username !== '' ? (
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={
                        'https://phabricator.wikimedia.org/p/' +
                        this.props.phabricator_username +
                        '/'
                      }
                    >
                      {this.props.phabricator_username}
                    </a>
                  ) : (
                      'None'
                    )}
                </h3>
                <h3 className="accounts">
                  {full_months[st_m] + " " + st.getFullYear()}
                  -
                  {full_months[(et_m + 11) % 12] + " " + (et_m - 1 > 0 ? et.getFullYear() : et.getFullYear() - 1)}
                </h3>
              </span>
            </React.Fragment>
          )}
      </div>
    );
  };
}

/**
 * Display the User Contribution Statistics and User Activity
 */
class QueryResult extends React.Component {
  constructor(props) {
    super(props);
    let data = false;
    let filters = {
      start_time: '',
      end_time: '',
    };

    /**
     * Perform API fetch, if no data found in this.props.location
     */

    if ('data' in this.props.location && this.props.location.data !== '') {
      data = this.props.location.data;
      filters = data.filters;
    }

    this.state = {
      query: this.props.match.params.hash,
      loading: data === false,
      data: data !== false ? data.result : [],
      current: data !== false ? data.current : null,
      prev: data !== false ? data.previous : null,
      next: data !== false ? data.next : null,
      notFound: false,
      value: '',
      activity: undefined,
      current_filters: Object.assign({}, filters),
      update_filters: Object.assign({}, filters),
      page_load: data === false,
      view_filters: false,
      gerrit_username: data !== false ? data.current_gerrit : null,
      phab_username: data !== false ? data.current_phabricator : null,
    };
  }

  set = obj => {
    /**
     * Update the current component's state from child components.
     * @param {Object} obj Object with all the updated params of the current state.
     */
    this.setState(obj);
  };

  getGraphData = platform => {
    /**
     * Format the User contribution data to input graphs.
     * @param {String} platform Pltoform according to which the data is to be formatted.
     * @returns {Object} Formatted data according to the platform inputted.
     */
    let data = {};
    if (platform === 'phabricator') {
      data = {
        type: 'stacked',
        labels: months,
        datasets: [
          {
            label: 'Assigned',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            lineTension: 0.4,
          },
          {
            label: 'Owned',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            borderColor: 'rgba(255, 204, 51, 0.6)',
            backgroundColor: 'rgba(255, 204, 51, 0.2)',
            lineTension: 0.4,
          },
          {
            label: 'All',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            borderColor: 'rgba(0, 175, 137, 0.6)',
            backgroundColor: 'rgba(0, 175, 137, 0.2)',
            lineTension: 0.4,
          },
        ],
      };
    } else {
      data = {
        labels: months,
        datasets: [
          {
            label: 'Contributions',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            borderColor: 'rgba(0, 175, 137, 0.6)',
            backgroundColor: 'rgba(0, 175, 137, 0.2)',
            lineTension: 0.1,
          },
        ],
      };
    }
    this.state.data.forEach(e => {
      let index = new Date(parseInt(e.time) * 1000).getMonth();
      if (platform === 'phabricator' && platform in e) {
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
      } else if (platform !== 'phabricator' && platform in e) {
        data.datasets[0].data[index] += 1;
      }
    });

    /*
     * Sort data array based on the start date such that
     * the data in the `Phabricator` and `Gerrit` graph
     * flows left to right i.e., from a past month to the
     * selected month.
     */

    let data_len = data.datasets.length,
      start_time = this.state.current_filters.start_time,
      m_index = new Date(start_time).getUTCMonth(),
      lbl_a = months.slice(0, m_index),
      lbl_b = months.slice(m_index);

    data.labels = lbl_b.concat(lbl_a);

    for (var i = 0; i < data_len; i++) {
      if (data.datasets[i]) {
        let set_a = data.datasets[i].data,
          set_b = set_a.splice(m_index);

        data.datasets[i].data = set_b.concat(set_a);
      }
    }

    return data;
  };

  callback = response => {
    /**
     * Callback function that feeds the fetched information to the state.
     * @param {Object} response Response data from API fetch
     */
    if (response.error !== 1) {
      let filters = response.filters;
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
        update_filters: filters,
      });
    } else {
      this.setState({
        loading: false,
        page_load: false,
        notFound: true,
      });
    }
  };

  componentDidMount = () => {
    if (this.state.data.length === 0) {
      this.setState({ loading: true, notFound: false });
      let uri = fetchDetails.replace('<hash>', this.state.query);
      fetchAsynchronous(uri, 'GET', {}, {}, this.callback);
    }
  };

  getDetails = username => {
    /**
     * Fetch the contributions of the user.
     * @param {String} username Username of the user whose contributions are to be fetched.
     */
    let uri =
      fetchDetails.replace('<hash>', this.state.query) + '?user=' + username;
    fetchAsynchronous(uri, 'GET', {}, {}, this.callback);
    this.setState({
      loading: true,
      activity: undefined,
      value: '',
      notFound: false,
    });
  };

  check_filters = () => {
    /**
     * Check if the User updated the filters.
     * @returns {Object} return updated filters. If no filters updated, return False
     */
    let { update_filters: uf, current_filters: cf } = this.state;
    if (JSON.stringify(uf) !== JSON.stringify(cf)) {
      let out = {};
      if (uf.start_time !== cf.start_time) {
        out['start_time'] = uf.start_time;
      }
      if (uf.end_time !== cf.end_time) {
        out['end_time'] = uf.end_time;
      }

      return out;
    }
    return false;
  };

  updatecallback = response => {
    /**
     * Callback function to feed the fetched data(on updating filters) to the state.
     * @param {Object} response Updated data and filters.
     */
    if (response.error !== 1) {
      this.setState({
        data: response.result,
        current_filters: this.state.update_filters,
        loading: false,
      });
    } else {
      this.setState({
        loading: false,
        notFound: true,
      });
    }
  };

  handleSearchClick = () => {
    /**
     * Update Filters and fetch API to get the Updated data.
     */
    let data = this.check_filters();
    if (data !== false) {
      data['username'] = this.state.current;
      this.setState({ loading: true, activity: undefined, notFound: false });
      fetchAsynchronous(
        filterDetailApi.replace('<hash>', this.state.query),
        'PATCH',
        data,
        { 'Content-Type': 'application/json' },
        this.updatecallback
      );
    }
  };

  onUserSearch = obj => {
    /**
     * Fetch API on searching for a user
     * @param {Object} obj Username of the user whose details are to be fetched.
     */
    this.setState({
      value: obj.value,
      loading: true,
      notFound: false,
      activity: undefined,
    });
    let uri =
      fetchDetails.replace('<hash>', this.state.query) + '?user=' + obj.value;
    fetchAsynchronous(uri, 'GET', {}, {}, this.callback);
  };

  handleReset = () => {
    /**
     * Restore the initial filters.
     */
    let time = new Date();
    let month = time.getMonth() + 2;
    let filters = {
      end_time: time.getFullYear() + '-' + month + '-01',
      start_time: time.getFullYear() - 1 + '-' + month + '-01',
      username: this.state.current,
    };
    this.setState({
      loading: true,
      activity: undefined,
      update_filters: Object.assign(filters),
      notFound: false,
    });
    let data = Object.assign({}, filters);
    fetchAsynchronous(
      filterDetailApi.replace('<hash>', this.state.query),
      'PATCH',
      data,
      { 'Content-Type': 'application/json' },
      this.updatecallback
    );
  };

  func = () => {
    let { update_filters: uf } = this.state;
    let month = new Date(uf.end_time).getUTCMonth();
    let year = new Date(uf.end_time).getFullYear();
    if (month === 0) {
      month = 11;
      year -= 1;
    } else {
      month -= 1;
    }
    return full_months[month] + ", " + year;
  }

  render = () => {
    document.body.style.backgroundColor = '#f8f9fa';
    let { update_filters: uf, current_filters: cf } = this.state;
    return (
      <React.Fragment>
        {this.state.prev !== null ? (
          <Popup
            content={'Fetch about ' + this.state.prev}
            position={'bottom left'}
            trigger={
              <div className="left_arrow">
                <Button
                  aria-label="previous user"
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
          ''
        )}

        {this.state.next !== null ? (
          <div className="right_arrow">
            <Popup
              content={'Fetch about ' + this.state.next}
              position={'bottom right'}
              trigger={
                <Button
                  primary
                  aria-label="next user"
                  className="page_button"
                  icon="arrow right"
                  disabled={this.state.loading}
                  onClick={() => this.getDetails(this.state.next)}
                />
              }
            />
          </div>
        ) : (
          ''
        )}
        <NavBar />
        <Grid>
          <Grid.Row>
              <div className="result">
                <h1 className="result_page_heading">Query Result</h1>
                {this.state.page_load ? (
                  <Placeholder fluid className="search_load">
                    <Placeholder.Line className="load_background" />
                  </Placeholder>
                ) : (
                  <div className="controls">
                    <div className="search">
                        <UserSearch
                          set={this.onUserSearch}
                          hash={this.state.query}
                          value={this.state.value}
                        />
                      </div>


                      <div className="filter_and_update">
                      <div className="filter">
                        <Popup
                          content="View Filters"
                          position="top center"
                          trigger={
                            <Button
                              icon="options"
                              className="filters"
                              aria-label="filters"
                              onClick={() =>
                                this.setState({
                                  view_filters: !this.state.view_filters,
                                })
                              }
                            />
                          }
                        />
                      </div>
                      <div className="update">
                        <Popup
                          content="Update"
                          position="top center"
                          trigger={
                            <Button
                              className="update_query"
                              aria-label="update query"
                              icon="write"
                              as={Link}
                              to={
                                process.env.NODE_ENV === 'production'
                                  ? tool_name +
                                    '/query/' +
                                    this.state.query +
                                    '/update/'
                                  : '/query/' + this.state.query + '/update/'
                              }
                            />
                          }
                        />
                      </div>
                    </div>
                    </div>
                )}
                <Transition
                  animation="fade down"
                  duration={300}
                  visible={this.state.view_filters}
                >
                  <Card className="filter_view">
                    <Grid>
                      <Grid.Column computer={8} tablet={16} mobile={16}>
                        <Header>From</Header>
                        <Dropdown
                          style={{ marginTop: 10 }}
                          fluid
                          search
                          selection
                          icon={false}
                          value={this.func()}
                          options={get_dates()}
                          onChange={(e, obj) => {
                            let date = obj.value.split(',');
                            date[1] = date[1].substr(1);
                            date[0] = full_months.indexOf(date[0]) + 2;
                            if (date[0] === 13) {
                              date[1] = parseInt(date[1]) + 1;
                              date[0] = 1;
                            }
                            let filters = Object.assign({}, uf);
                            filters.end_time = date[1] + '-' + date[0] + '-01';
                            let days = get_timestamp(
                              new Date(uf.end_time),
                              new Date(uf.start_time)
                            );
                            let incr =
                              days === 30
                                ? 1
                                : days === 60
                                ? 2
                                : days === 90
                                ? 3
                                : days === 180
                                ? 6
                                : 12;

                            let updated_val = new Date(filters.end_time);
                            let start_time = new Date(
                              updated_val.getFullYear(),
                              updated_val.getUTCMonth() - incr,
                              1
                            );
                            let month = start_time.getUTCMonth() + 1;
                            filters.start_time =
                              start_time.getFullYear() + '-' + month + '-01';
                            this.setState({
                              update_filters: filters,
                            });
                          }}
                          placeholder="Select Date"
                          closeOnChange={true}
                        />
                      </Grid.Column>
                      <Grid.Column computer={8} tablet={16} mobile={16}>
                        <Header>Time Range</Header>
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
                              date.getUTCMonth() - incr,
                              1
                            );
                            let month = date.getUTCMonth() + 1;
                            let filters = Object.assign({}, uf);
                            filters.start_time =
                              date.getFullYear() + '-' + month + '-' + 1;
                            this.setState({ update_filters: filters });
                          }}
                          placeholder="Get by date"
                          closeOnChange={true}
                        />
                      </Grid.Column>
                    </Grid>
                    <div style={{ width: '100%' }}>
                      <Button
                        className="apply_filters"
                        onClick={() => this.handleSearchClick()}
                      >
                        APPLY
                      </Button>
                      <Button
                        className="reset_filters"
                        onClick={() => this.handleReset()}
                      >
                        RESET
                      </Button>
                    </div>
                  </Card>
                </Transition>
              </div>
          </Grid.Row>
          {this.state.notFound ? (
            <NotFound />
          ) : (
            <React.Fragment>
              <Grid.Row>
                <Grid.Column width={2} />
                <Grid.Column width={12}>
                  <DisplayUser
                    loading={this.state.loading}
                    username={this.state.current}
                    gerrit_username={this.state.gerrit_username}
                    phabricator_username={this.state.phab_username}
                    filters={this.state.current_filters}
                  />
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column computer={2} mobile={1} tablet={1} />
                <Grid.Column computer={12} tablet={14} mobile={14}>
                  <Grid>
                    <Grid.Row>
                      <Grid.Column computer={8} mobile={16} tablet={8}>
                        {this.state.loading ? (
                          <Card className="graph_load">
                            <Card.Content>
                              <Placeholder fluid className="image_load">
                                <Placeholder.Line />
                              </Placeholder>
                            </Card.Content>
                          </Card>
                        ) : (
                          <Card className="chart_container">
                            <span style={{ textAlign: 'center' }}>
                              <Header className="chart"> PHABRICATOR </Header>
                              <Line
                                ref="chart"
                                data={this.getGraphData('phabricator')}
                                options={chartOptions}
                              />
                            </span>
                          </Card>
                        )}
                      </Grid.Column>
                      <Grid.Column computer={8} mobile={16} tablet={8}>
                        {this.state.loading ? (
                          <Card className="graph_load">
                            <Card.Content>
                              <Placeholder fluid className="image_load">
                                <Placeholder.Line />
                              </Placeholder>
                            </Card.Content>
                          </Card>
                        ) : (
                          <Card className="chart_container">
                            <span style={{ textAlign: 'center' }}>
                              <Header className="chart"> GERRIT </Header>
                              <Line
                                ref="chart"
                                data={this.getGraphData('gerrit')}
                                options={chartOptions}
                              />
                            </span>
                          </Card>
                        )}
                      </Grid.Column>
                    </Grid.Row>
                  </Grid>
                </Grid.Column>
                <Grid.Column computer={2} mobile={1} tablet={1} />
              </Grid.Row>
              <Grid.Row>
                <Grid.Column width={2} />
                <Grid.Column width={12}>
                  <Card className="chart_container">
                    <Header className="chart"> TOTAL CONTRIBUTIONS </Header>
                    <UserContribution
                      start_time={cf.start_time}
                      end_time={cf.end_time}
                      user={this.state.current}
                      data={this.state.data}
                      set={this.set}
                      loading={this.state.loading}
                    />
                  </Card>
                </Grid.Column>
                <Grid.Column width={2} />
              </Grid.Row>
              {this.state.activity !== undefined ? (
                  <div className="activity_wrapper">
                    <Activity
                      date={this.state.activity}
                      hash={this.state.query}
                      username={this.state.current}
                    />
                  </div>
              ) : (
                ''
              )}
            </React.Fragment>
          )}
        </Grid>
      </React.Fragment>
    );
  };
}

export default QueryResult;
