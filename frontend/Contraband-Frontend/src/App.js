import React, { Component } from "react";
import "./App.css";
import { Route, Switch, BrowserRouter } from "react-router-dom";
import { Query, QueryDelete } from "./query";
import QueryResult from "./result";
import NotFound from "./components/404";
import Doc from "./doc";
import UserContribution from "./contribution";

/*
    All the Routers are declared here.
*/

export const production = true;

class App extends Component {
  state = {
    text: "/contrabandapp"
  };
  render() {
    let { text: t } = this.state;
    let domain = production ? t : "";
    return (
      <BrowserRouter>
        <Switch>
          {/* 404 handler */}
          <Route exact path={domain + "/404/"} component={NotFound} />
          {/* 404 handler */}
          <Route
            exact
            path={domain + "/contribution/"}
            component={UserContribution}
          />
          {/* Docs page */}
          <Route exact path={domain + "/docs/"} component={Doc} />
          {/* Create a new Query */}
          <Route exact path={domain + "/"} component={Query} />
          {/* Update a Query */}
          <Route
            exact
            path={domain + "/query/:hash/update/"}
            component={Query}
          />
          {/* Delete a Query */}
          <Route
            exact
            path={domain + "/query/:hash/delete/"}
            component={QueryDelete}
          />
          {/* Result to the query */}
          <Route exact path={domain + "/:hash/"} component={QueryResult} />
          {/* 404 Handler */}
          <Route component={NotFound} />
        </Switch>
      </BrowserRouter>
    );
  }
}

export default App;
