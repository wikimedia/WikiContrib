import React from 'react';
import { fetchAsynchronous } from './fetch';
import { commits_by_date } from './../api';
import { Card, Placeholder, Header, Button, Popup } from 'semantic-ui-react';
import gerritPlatformIcon from '../img/gerritPlatformIcon.png';
import phabricatorPlatformIcon from '../img/phabricatorPlatformIcon.png';
import abandonedStatusIcon from '../img/abandonedStatusIcon.png';
import openStatusIcon from '../img/openStatusIcon.png';
import mergedStatusIcon from '../img/mergedStatusIcon.png';
import resolvedStatusIcon from '../img/resolvedStatusIcon.png';
import invalidStatusIcon from '../img/invalidStatusIcon.png';
import stalledStatusIcon from '../img/stalledStatusIcon.png';
import rejectedStatusIcon from '../img/rejectedStatusIcon.png';
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

  /**
   * Select corresponding platform and status icon.
   * @param {string} platform The platform of the activity.
   * @param {string} status The status of the contribution.
   * @return {Array} The paths of the corresponding platform icon and status.
   */
  cardIconsPaths = (platform, status) => {
    let platformPath;
    let statusPath;
    if (platform.toLowerCase() == "gerrit") {
      platformPath = gerritPlatformIcon;
      if (status.toLowerCase() == "abandoned") {
        statusPath = abandonedStatusIcon;
      } else if (status.toLowerCase() == "open") {
        statusPath = openStatusIcon;
      } else {
        statusPath = mergedStatusIcon;
      }
    } else {
      platformPath = phabricatorPlatformIcon;
      if (status.toLowerCase() == "resolved") {
        statusPath = resolvedStatusIcon;
      } else if (status.toLowerCase() == "invalid") {
        statusPath = invalidStatusIcon;
      } else if (status.toLowerCase() == "stalled") {
        statusPath = stalledStatusIcon;
      } else {
        statusPath = rejectedStatusIcon;
      }
    }
    return {
      platform: platformPath,
      status: statusPath
    };
  };

  /**
   * Stylize given word, capitalizing the first letter.
   * @param {string} originalWord The word you want to normalize.
   * @return {string} The same word with first letter capitalized.
   */
  normalizeWord = (originalWord) => {
    originalWord = originalWord.toLowerCase();
    return originalWord.slice(0,1).toUpperCase() + originalWord.slice(1);
  };

  render = () => {
    return (
      <React.Fragment>
        {this.state.loading ? (
          <React.Fragment>
            <Card className="commits_load loading_card">
              <Placeholder fluid>
                <Placeholder.Line />
                <Placeholder.Line />
                <Placeholder.Line />
              </Placeholder>
            </Card>
            <Card className="commits_load loading_card">
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
                <h4>{this.props.username}'s activity on {this.props.date}</h4>
                {this.state.data.map((obj, index) => (
                  <Card className="commits_load" key={index}>
                    <Card.Content>
                    <div class="card">
                      <div class="platform">
                        <Popup
                          content={this.normalizeWord(obj.platform)}
                          position="top center"
                          trigger={
                            <a href={obj.platform.toLowerCase() == "phabricator" ? ("https://phabricator.wikimedia.org/"
                          ) : (
                            "https://gerrit.wikimedia.org/r/#/q/"
                          )
                        }><img height="40px" src={this.cardIconsPaths(obj.platform, obj.status).platform}></img></a>
                          }
                        />
                      </div>
                      <div class="title">
                      {obj.platform === 'Phabricator' ? (
                        <a href={'https://phabricator.wikimedia.org/' + obj.redirect} target="_blank" rel="noopener noreferrer">
                          <h3>{obj.heading}</h3>
                        </a>
                      ) : (
                        <a href={'https://gerrit.wikimedia.org/r/#/q/' + obj.redirect} target="_blank" rel="noopener noreferrer">
                          <h3>{obj.heading}</h3>
                        </a>
                      )}
                      </div>
                      <div class="status">
                        <Popup
                          content={this.normalizeWord(obj.status)}
                          position="top center"
                          trigger={
                            <img height="40px" src={this.cardIconsPaths(obj.platform, obj.status).status}></img>
                          }
                          />
                      </div>
                    </div>
                    </Card.Content>
                  </Card>
                ))}
              </React.Fragment>
            ) : (
              <Header className="chart" style={{ textAlign: 'center' }}>
                {' '}
                {this.props.username} has no activity on this day.{' '}
              </Header>
            )}
          </React.Fragment>
        )}
      </React.Fragment>
    );
  };
}

export default Activity;
