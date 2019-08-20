import React from 'react';
import { fetchAsynchronous } from './fetch';
import { commits_by_date } from './../api';
import { Card, Placeholder, Header } from 'semantic-ui-react';


/**
 * Show all the user Commits on a specific day
 */
class Activity extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      data: [],
    };
  }

  fetchAPI = () => {
    /**
     * Fetch API to get the commits on a specific date.
     */
    let uri =
      commits_by_date.replace('<hash>', this.props.hash) +
      '?created=' +
      this.props.date;
    fetchAsynchronous(uri, 'GET', {}, {}, this.callback);
  };

  componentDidMount = () => {
    this.fetchAPI();
  };

  componentDidUpdate = (prevProps, prevState) => {
    if (prevProps.date !== this.props.date) {
      this.setState({ loading: true });
      this.fetchAPI();
    }
  };

  callback = response => {
    /**
     * Callback function to feed the fetched data from API to the state of current component.
     * @param {Object} response JSON data returned from the API.
     */
    this.setState({
      loading: false,
      data: response.results,
    });
  };

  render = () => {
    return (
      <React.Fragment>
        {this.state.loading ? (
          <React.Fragment>
            <Card className="commits_load">
              <Placeholder fluid>
                <Placeholder.Line />
                <Placeholder.Line />
                <Placeholder.Line />
              </Placeholder>
            </Card>
            <Card className="commits_load">
              <Placeholder fluid>
                <Placeholder.Line />
                <Placeholder.Line />
                <Placeholder.Line />
              </Placeholder>
            </Card>
          </React.Fragment>
        ) : (
            <React.Fragment>
              {this.state.data.length !== 0 ? (
                <React.Fragment>
                  <h4>User Activity on {this.props.date}</h4>
                  {this.state.data.map((obj, index) => (
                    <Card className="commits_load" key={index}>
                      <Card.Content>
                        {obj.platform === 'Phabricator' ? (
                          <a
                            href={
                              'https://phabricator.wikimedia.org/' + obj.redirect
                            }
                            target="_blank"
                          >
                            <h3>{obj.heading}</h3>
                          </a>
                        ) : (
                            <a
                              href={
                                'https://gerrit.wikimedia.org/r/#/q/' + obj.redirect
                              }
                              target="_blank"
                            >
                              <h3>{obj.heading}</h3>
                            </a>
                          )}
                        <div>
                          <span style={{ display: 'inline', float: 'left' }}>
                            <b>PLATFORM:</b> {obj.platform}
                          </span>
                          <span style={{ display: 'inline', float: 'right' }}>
                            <b>STATUS:</b> {obj.status}
                          </span>
                        </div>
                      </Card.Content>
                    </Card>
                  ))}
                </React.Fragment>
              ) : (
                  <Header className="chart" style={{ textAlign: "center" }}> {this.props.username} has no activity on this day. </Header>
                )}
            </React.Fragment>
          )}
      </React.Fragment>
    );
  };
}

export default Activity;
