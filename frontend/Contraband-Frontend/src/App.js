import React, { Component } from "react";
import "./App.css";
import { Route, Switch, BrowserRouter } from "react-router-dom";
import { QueryCreate, QueryUpdate, QueryDelete, QueryView } from "./query";
import { filterCreate, filterUpdate, filterDelete, filterView } from "./filter";

/*
    All the Routers are declared here.
*/

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Switch>
          {/* View a Query */}
          <Route exact path="/query/<hash>/" component={QueryView} />
          {/* Create a new Query */}
          <Route exact path="/" component={QueryCreate} />
          {/* Update a Query */}
          <Route exact path="/query/:hash/update/" component={QueryUpdate} />
          {/* Delete a Query */}
          <Route exact path="/query/:hash/delete/" component={QueryDelete} />
          {/* View filters of the Query */}
          <Route exact path="/:hash/filters/" component={filterView} />
          {/* Add filters to the Query */}
          <Route exact path="/:hash/filters/add/" component={filterCreate} />
          {/* Update filters of the Query */}
          <Route exact path="/:hash/filters/update/" component={filterUpdate} />
          {/* Delete filters of the Query */}
          <Route exact path="/:hash/filters/delete/" component={filterDelete} />
        </Switch>
      </BrowserRouter>
    );
  }
}

export default App;
