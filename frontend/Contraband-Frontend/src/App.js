import React, { Component } from "react";
import "./App.css";
import { Route, Switch, BrowserRouter } from "react-router-dom";
import { Query, QueryDelete } from "./query/query";
import { filter, filterDelete } from "./filter";
import QueryResult from "./result/result";
import NotFound from "./components/404";

/*
    All the Routers are declared here.
*/

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Switch>
          {/* 404 handler */}
          <Route exact path="/404/" component={NotFound} />
          {/* Create a new Query */}
          <Route exact path="/" component={Query} />
          {/* Update a Query */}
          <Route exact path="/query/:hash/update/" component={Query} />
          {/* Delete a Query */}
          <Route exact path="/query/:hash/delete/" component={QueryDelete} />
          {/* Add filters to the Query */}
          <Route exact path="/:hash/filters/add/" component={filter} />
          {/* Update filters of the Query */}
          <Route exact path="/:hash/filters/update/" component={filter} />
          {/* Delete filters of the Query */}
          <Route exact path="/:hash/filters/delete/" component={filterDelete} />
          {/* Result to the query */}
          <Route exact path="/:hash/" component={QueryResult} />
          {/* 404 Handler */}
          <Route component={NotFound} />
        </Switch>
      </BrowserRouter>
    );
  }
}

export default App;
