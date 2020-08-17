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
  Icon
} from 'semantic-ui-react';
import { fetchAsynchronous } from './components/fetch';
import { Link } from 'react-router-dom';
import {
  filter_2,
  get_dates,
  time_delta,
  zero_pad,
  getDaysInMonth,
  months,
  fetchDetails,
  full_months,
  get_num_days,
  filterDetailApi,
} from './api';
// import UserSearch from './components/dropdown';
import { Line } from 'react-chartjs-2';
import UserContribution from './contribution';
import Activity from './components/activity';
import NotFound from './components/404';
import { NavBar, Footer } from './components/nav';

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



class GoToTop extends React.Component {
  state = {
       showButton: false
   };

  componentDidMount() {
      document.addEventListener("scroll", () => {
          if (window.scrollY > 170) {
              this.setState({ showButton: true })
          } else {
              this.setState({ showButton: false })
          }
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }


  scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  render(){
      return (
          <React.Fragment>
              { this.state.showButton ?
                <Button className="go-top" onClick={this.scrollToTop}>
                  <Icon name="caret up" size="big" inverted />
                </Button>
                :
                null
              }
          </React.Fragment>
      )
  }
}

/**
 * Display Fullname, Phabricator Username, Gerrit Username and Github Username of the user.
 */
class DisplayUser extends React.Component {
  render = () => {
    return (
      <div className="profile">
        {this.props.loading ? (
          <React.Fragment>
            <Placeholder>
              <Placeholder.Line className="load_background" />
              <Placeholder.Line className="load_background" />
            </Placeholder>
          </React.Fragment>
        ) : (
            <React.Fragment>
                <h3 className="accounts usernames">
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
                    )}{' '}
                  | Github:{' '}
                  {this.props.github_username !== '' ? (
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={
                        'https://github.com/' +
                        this.props.github_username +
                        '/'
                      }
                    >
                      {this.props.github_username}
                    </a>
                  ) : (
                      'None'
                    )}
                </h3>

                <div className="update filter_and_update">
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
                          '/query/' + this.props.query + '/update/'
                        }
                      />
                    }
                  />
                </div>
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
      meta: data !== false ? data.meta : {},
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
      github_username: data !== false ? data.current_github : null
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
            label: 'Authored',
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

    let current_month = [0, 0, 0];

    this.state.data.forEach(e => {
      let index = new Date(e.time);
      let index_year = index.getFullYear();
      index = index.getMonth();

      let et = this.state.current_filters.end_time;
      et = new Date(et);
      let et_m = et.getMonth();
      let et_y = et.getFullYear();

      if (platform === 'phabricator' && e.platform.toLowerCase() === platform) {
        if (e.assigned && !e.authored) {
            if (index === et_m && index_year === et_y) {
              current_month[0] += 1;
              current_month[2] += 1;
            } else {
              data.datasets[0].data[index] += 1;
              data.datasets[2].data[index] += 1;
            }
        } else if (e.authored && !e.assigned) {
          if (index === et_m && index_year === et_y) {
            current_month[1] += 1;
            current_month[2] += 1;
          } else {
            data.datasets[1].data[index] += 1;
            data.datasets[2].data[index] += 1;
          }
        } else {
          if (index === et_m && index_year === et_y) {
            current_month[0] += 1;
            current_month[1] += 1;
            current_month[2] += 1;
          } else {
            data.datasets[0].data[index] += 1;
            data.datasets[1].data[index] += 1;
            data.datasets[2].data[index] += 1;
          }
        }
      } else if (platform !== 'phabricator' && e.platform.toLowerCase() === platform) {
          if(index === et_m && index_year === et_y){
            current_month[0] += 1;
          } else {
            data.datasets[0].data[index] += 1;
          }
      }
    });

    /*
     * Sort data array based on the start date such that
     * the data in the `Phabricator` and `Gerrit` and `Github` graph
     * flows left to right i.e., from a past month to the
     * selected month.
     */

    let data_len = data.datasets.length,
      end_time = this.state.current_filters.end_time,
      m_index = new Date(end_time).getMonth(),
      lbl_a = months.slice(0, m_index),
      lbl_b = months.slice(m_index);

    data.labels = lbl_b.concat(lbl_a, lbl_b[0]);

    for (var i = 0; i < data_len; i++) {
      if (data.datasets[i]) {
        let set_a = data.datasets[i].data,
          set_b = set_a.splice(m_index);

        data.datasets[i].data = set_b.concat(set_a, [current_month[i]]);
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
        meta: response !== false ? response.meta : {},
        current: response.current,
        prev: response.previous,
        gerrit_username: response.current_gerrit,
        phab_username: response.current_phabricator,
        github_username: response.current_github,
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
        meta: response !== false ? response.meta : {},
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
    let one_year = time_delta(365);

    let filters = {
      end_time: time.toISOString(),
      start_time: new Date(time - one_year).toISOString(),
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
    if (uf.end_time !== "" && uf.start_time !== "") {
    let month = new Date(uf.end_time).getMonth();
    let year = new Date(uf.end_time).getFullYear();

    return new Date(`${year}-${zero_pad(month+1)}-${getDaysInMonth(year, months[month])}`).toISOString();
    }
  }

  render = () => {
    document.body.style.backgroundColor = '#f8f9fa';
    let { update_filters: uf, current_filters: cf } = this.state;
    let { start_time: st, end_time: et } = cf;
    st = new Date(st);
    let st_m = st.getMonth();
    et = new Date(et);
    let et_m = et.getMonth();

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
        <GoToTop/>
        <Grid style={{marginBottom: '2em'}}>
          <Grid.Row>
              <div className="result">
                {this.state.page_load ? (
                  <Placeholder fluid className="search_load">
                    <Placeholder.Line className="load_background" />
                  </Placeholder>
                ) : (
                  <React.Fragment>
                  <Header><h2 className="name">{this.state.current+'\'s '}Activity</h2></Header>
                    <DisplayUser
                      loading={this.state.loading}
                      username={this.state.current}
                      gerrit_username={this.state.gerrit_username}
                      phabricator_username={this.state.phab_username}
                      github_username={this.state.github_username}
                      query={this.state.query}
                    />
                  <div className="controls">
                    <div className="search">
                        {/*<UserSearch
                          set={this.onUserSearch}
                          hash={this.state.query}
                          value={this.state.value}
                        />*/}
                        <h3 className="accounts">
                          {full_months[st_m] + " " + st.getFullYear()}
                          -
                          {full_months[et_m] + " " + et.getFullYear()}
                        </h3>
                      </div>

                      <div className="filter filter_and_update">
                        <Popup
                          content="View Filters"
                          position="top center"
                          trigger={
                            <Button
                              icon="write"
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
                    </div>
                  </React.Fragment>
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
                          options={filter_2}
                          value={get_num_days(
                            new Date(uf.start_time),
                            new Date(uf.end_time)
                          )}
                          onChange={(e, obj) => {
                            let date = new Date(
                              this.state.update_filters.end_time
                            );
                            let days = obj.value;

                            date = new Date(date - time_delta(days));

                            let filters = Object.assign({}, uf);
                            filters.start_time = date.toISOString();

                            this.setState({ update_filters: filters });
                          }}
                          placeholder="Get by date"
                          closeOnChange={true}
                        />
                      </Grid.Column>
                      <Grid.Column computer={8} tablet={16} mobile={16}>
                        <Header>To</Header>
                        <Dropdown
                          style={{ marginTop: 10 }}
                          fluid
                          search
                          selection
                          icon={false}
                          value={this.func()}
                          options={get_dates()}
                          onChange={(e, obj) => {
                            let filters = Object.assign({}, uf);
                            filters.end_time = obj.value;
                            let days = get_num_days(
                              new Date(uf.end_time),
                              new Date(uf.start_time)
                            );

                            let updated_val = new Date(filters.end_time);

                            let start_time = new Date(updated_val - time_delta(days));

                            filters.start_time = start_time.toISOString();

                            this.setState({
                              update_filters: filters,
                            });
                          }}
                          placeholder="Select Date"
                          closeOnChange={true}
                        />
                      </Grid.Column>
                    </Grid>
                    <div style={{ width: '100%' }}>
                    <Popup
                      content="Search"
                      position="top center"
                      trigger={
                      <Button
                        className="apply_filters"
                        onClick={() => this.handleSearchClick()}
                      >
                      <Icon name="search"/>
                      </Button>
                    }/>
                    <Popup
                      content="Reset"
                      position="top center"
                      trigger={
                      <Button
                        className="reset_filters"
                        onClick={() => this.handleReset()}
                      >
                        <Icon name="redo alternate"/>
                      </Button>
                    }/>
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
                  <div className="graphs">
                            <div className="graph">
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
                                    {this.state.meta.full_names.phab_full_name
                                     !== "OOPS! We couldn't find a username in your request." &&
                                     this.state.meta.full_names.phab_full_name
                                     !== "OOPS! We couldn't find an account with that username." ? (
                                      <Line
                                        ref="chart"
                                        data={this.getGraphData('phabricator')}
                                        options={chartOptions}
                                      />
                                    ) : (
                                      <div className="chart_message">
                                      <h2>{this.state.meta.full_names.phab_full_name}</h2>
                                      </div>
                                    )}
                                  </span>
                                </Card>
                              )}
                            </div>
                            <div className="graph">
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
                                    {this.state.meta.full_names.gerrit_full_name
                                     !== "OOPS! We couldn't find a username in your request." &&
                                     this.state.meta.full_names.gerrit_full_name
                                     !== "OOPS! We couldn't find an account with that username." ? (
                                      <Line
                                        ref="chart"
                                        data={this.getGraphData('gerrit')}
                                        options={chartOptions}
                                      />
                                    ) : (
                                      <div className="chart_message">
                                      <h2>{this.state.meta.full_names.gerrit_full_name}</h2>
                                      </div>
                                    )}
                                  </span>
                                </Card>
                              )}
                            </div>
                            <div className="graph">
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
                                    <Header className="chart"> GITHUB </Header>
                                    {this.state.meta.full_names.github_full_name
                                     !== "OOPS! We couldn't find a username in your request." &&
                                     this.state.meta.full_names.github_full_name
                                     !== "OOPS! We couldn't find an account with that username." ? (
                                      this.state.meta.rate_limits.github_rate_limit_message === "" ? (
                                        <Line
                                          ref="chart"
                                          data={this.getGraphData('github')}
                                          options={chartOptions}
                                        />
                                    ) : (
                                      <div className="chart_message">
                                      <h2>{this.state.meta.rate_limits.github_rate_limit_message}</h2>
                                      </div>
                                    )
                                    ) : (
                                      <div className="chart_message">
                                      <h2>{this.state.meta.full_names.github_full_name}</h2>
                                      </div>
                                    )}
                                  </span>
                                </Card>
                              )}
                            </div>
                          </div>
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
                <Grid.Row>
                  <Grid.Column width={2} />
                  <Grid.Column width={12}>
                    <div className="activity_wrapper">
                      <Activity
                        date={this.state.activity}
                        hash={this.state.query}
                        username={this.state.current}
                      />
                    </div>
                    </Grid.Column>
                  <Grid.Column width={2} />
                </Grid.Row>
                ) : (
                  ''
                )}
              </React.Fragment>
          )}
        </Grid>
        <Footer/>
      </React.Fragment>
    );
  };
}

export default QueryResult;
