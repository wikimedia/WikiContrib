import React, { Component } from "react";
import Stepper from "./components/stepper";

export class QueryCreate extends Component {
  constructor(props) {
    super(props);
    this.state = {
      step: 1
    };
  }

  render = () => (
    <div id="query_create">
      <Stepper step={this.state.step} />
      <br />
      <br />
      <div style={{ textAlign: "center" }}>
        <button onClick={() => this.setState({ step: this.state.step + 1 })}>
          continue
        </button>
      </div>
    </div>
  );
}

export class QueryUpdate extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render = () => <React.Fragment>update query</React.Fragment>;
}

export class QueryDelete extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render = () => <React.Fragment>Query Update</React.Fragment>;
}

export class QueryView extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render = () => <React.Fragment>Query view</React.Fragment>;
}
