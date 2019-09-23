import React, { Component } from 'react';
import './App.css';
import { Route, Switch, BrowserRouter } from 'react-router-dom';
import { Query } from './query';
import QueryResult from './result';
import NotFound from './components/404';
import UserContribution from './contribution';

/*
    All the Routers are declared here.
*/

export const tool_name = '/wikicontrib';

class App extends Component {
  render() {
    let domain = process.env.NODE_ENV === 'production' ? tool_name : '';
    return (
      <BrowserRouter>
        <Switch>
          {/* 404 handler */}
          <Route exact path={domain + '/404/'} component={NotFound} />
          {/* 404 handler */}
          <Route
            exact
            path={domain + '/contribution/'}
            component={UserContribution}
          />
          {/* Create a new Query */}
          <Route exact path={domain + '/'} component={Query} />
          {/* Update a Query */}
          <Route
            exact
            path={domain + '/query/:hash/update/'}
            component={Query}
          />
          {/* Result to the query */}
          <Route exact path={domain + '/:hash/'} component={QueryResult} />
          {/* 404 Handler */}
          <Route component={NotFound} />
        </Switch>
      </BrowserRouter>
    );
  }
}

export default App;
