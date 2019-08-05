import React, { Component } from "react";
import "./App.css";
import { Route, Switch, BrowserRouter } from "react-router-dom";
import { Query, QueryDelete } from "./query";
import QueryResult from "./result";
import NotFound from "./components/404";
import Doc from "./doc";
import UserContribution from "./contribution";
import Dropdown from "./components/dropdown";

/*
    All the Routers are declared here.
*/

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route exact path="/dropdown/" component={Dropdown} />
          {/* 404 handler */}
          <Route exact path="/404/" component={NotFound} />
          {/* 404 handler */}
          <Route exact path="/contribution/" component={UserContribution} />
          {/* Docs page */}
          <Route exact path="/docs/" component={Doc} />
          {/* Create a new Query */}
          <Route exact path="/" component={Query} />
          {/* Update a Query */}
          <Route exact path="/query/:hash/update/" component={Query} />
          {/* Delete a Query */}
          <Route exact path="/query/:hash/delete/" component={QueryDelete} />
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
