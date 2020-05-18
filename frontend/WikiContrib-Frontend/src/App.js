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


class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Switch>
          {/* 404 handler */}
          <Route exact path={'/404/'} component={NotFound} />

          {/* Display user Contribuions */}
          <Route
            exact
            path={'/contribution/'}
            component={UserContribution}
          />

          {/* Create a new Query */}
          <Route exact path={'/'} component={Query} />

          {/* Update a Query */}
          <Route
            exact
            path={'/query/:hash/update/'}
            component={Query}
          />

          {/* Result to the query */}
          <Route exact path={'/:hash/'} component={QueryResult} />

          {/* 404 Handler */}
          <Route component={NotFound} />
        </Switch>
      </BrowserRouter>
    );
  }
}

export default App;
