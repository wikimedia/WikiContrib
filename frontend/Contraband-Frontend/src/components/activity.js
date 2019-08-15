import React from 'react';
import { fetchAsynchronous } from './fetch';
import { commits_by_date } from './../api';
import { Card, Placeholder, Grid } from 'semantic-ui-react';

class Activity extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      data: [],
    };
  }

  fetchAPI = () => {
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
            <Card style={{ width: '100%', padding: '2%' }}>
              <Placeholder fluid>
                <Placeholder.Line />
                <Placeholder.Line />
                <Placeholder.Line />
              </Placeholder>
            </Card>
            <Card style={{ width: '100%', padding: '2%' }}>
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
                  <Card style={{ width: '100%' }} key={index}>
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
              <div
                style={{
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: 20,
                  width: '100%',
                }}
              >
                {this.props.username} has no activity on this day.
              </div>
            )}
          </React.Fragment>
        )}
      </React.Fragment>
    );
  };
}

export default Activity;
