import React, { Component } from 'react';
import './App.css';
import { Route, Switch, BrowserRouter } from 'react-router-dom';
import { Query } from './query';
import Loadable from 'react-loadable'

const Loading = ({ error }) => {
  if (error) return <div>Error loading component</div>
  else return <div>Loading.....</div>
}

const QueryResult = Loadable({
  loader: () => import('./result'),
  loading: Loading
})

const NotFound = Loadable({
  loader: () => import('./components/404'),
  loading: Loading
})

const UserContribution = Loadable({
  loader: () => import('./contribution'),
  loading: Loading
})

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

          {/* Display user Contribuions */}
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
