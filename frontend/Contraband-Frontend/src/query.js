import React, { Component } from "react";
import Stepper from "./components/stepper";
import MessageDisplay from "./components/message";
import csv from "./img/csv.png";
import format from "./img/format.png";
import {
  Card,
  Grid,
  Divider,
  Table,
  Button,
  Icon,
  Popup,
  Tab
} from "semantic-ui-react";

export class QueryCreate extends Component {
  constructor(props) {
    super(props);
    this.state = {
      step: 1,
      rows: [
        {
          fullname: "",
          gerrit_username: "",
          phabricator_username: "",
          github_username: ""
        }
      ],
      message: {
        message: "",
        type: "",
        update: false,
        trigger: false
      },
      expand: 0,
      file: false
    };
  }

  handlChange = (name, value, index) => {
    let rows = [...this.state.rows];
    rows[index][name] = value;
    this.setState({ rows: rows });
  };

  addrow = () => {
    let rows = [...this.state.rows];
    rows.push({
      fullname: "",
      gerrit_username: "",
      phabricator_username: "",
      github_username: ""
    });

    this.setState({ rows: rows });
  };

  removeRow = index => {
    if (index === 0 && this.state.rows.length === 1) {
      let message = Object.entries({}, this.state.message);
      message["message"] = "The table must contain atleast one row";
      message["trigger"] = true;
      message["type"] = 1;
      message["update"] = !this.state.message.update;
      this.setState({ message: message });
    } else {
      let rows = [...this.state.rows];
      rows.splice(index, 1);
      this.setState({ rows: rows });
    }
  };

  addFile = file => {
    console.log(file.type);
    if (file.type === "text/csv") {
      this.setState({ file: file });
    } else {
      this.setState({
        message: {
          message: "Only CSV files can be uploaded!",
          trigger: true,
          update: !this.state.message.update,
          type: 1
        }
      });
    }
  };

  render = () => {
    return (
      <React.Fragment>
        <Stepper step={this.state.step} />
        <MessageDisplay
          message={this.state.message.message}
          type={this.state.message.type}
          update={this.state.message.update}
          trigger={this.state.message.trigger}
        />
        <Grid>
          <Grid.Row>
            <Grid.Column computer={3} tablet={1} mobile={1} />
            <Grid.Column computer={10} tablet={14} mobile={14}>
              <Card className="query_create" id="minor_screen_table">
                <div className="table_entry">
                  <h4 style={{ marginLeft: 10, display: "inline" }}>
                    Add Usernames
                  </h4>
                  <Popup
                    content={
                      <div>
                        <h4>Add usernames</h4> Add usernames directly through
                        the table and initiate the query.
                      </div>
                    }
                    on="click"
                    pinned
                    position="bottom center"
                    trigger={
                      <Icon
                        name="info circle"
                        size="large"
                        style={{
                          cursor: "pointer",
                          float: "right",
                          color: "white"
                        }}
                      />
                    }
                  />
                  <Table singleLine>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell style={{ textAlign: "center" }}>
                          Full name
                        </Table.HeaderCell>
                        <Table.HeaderCell style={{ textAlign: "center" }}>
                          Gerrit username
                        </Table.HeaderCell>
                        <Table.HeaderCell style={{ textAlign: "center" }}>
                          Phabricator username
                        </Table.HeaderCell>
                        <Table.HeaderCell style={{ textAlign: "center" }} />
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {this.state.rows.map((obj, index) => (
                        <Table.Row key={index}>
                          <Table.Cell style={{ textAlign: "center" }}>
                            <input
                              className="user_input"
                              value={obj.fullname}
                              name="fullname"
                              placeholder="Enter fullname"
                              onChange={e =>
                                this.handlChange(
                                  e.target.name,
                                  e.target.value,
                                  index
                                )
                              }
                            />
                          </Table.Cell>
                          <Table.Cell style={{ textAlign: "center" }}>
                            <input
                              className="user_input"
                              value={obj.gerrit_username}
                              name="gerrit_username"
                              placeholder="Enter Gerrit username"
                              onChange={e =>
                                this.handlChange(
                                  e.target.name,
                                  e.target.value,
                                  index
                                )
                              }
                            />
                          </Table.Cell>
                          <Table.Cell style={{ textAlign: "center" }}>
                            <input
                              className="user_input"
                              value={obj.phabricator_username}
                              name="phabricator_username"
                              placeholder="Enter Phab. Username"
                              onChange={e =>
                                this.handlChange(
                                  e.target.name,
                                  e.target.value,
                                  index
                                )
                              }
                            />
                          </Table.Cell>
                          <Table.Cell style={{ textAlign: "center" }}>
                            <Icon
                              name="minus circle"
                              style={{ cursor: "pointer", color: "#f46461" }}
                              onClick={() => this.removeRow(index)}
                            />
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                  <Button
                    icon
                    labelPosition="left"
                    style={{ float: "right" }}
                    onClick={this.addrow}
                  >
                    <Icon name="plus" />
                    Add
                  </Button>
                </div>
                <Divider horizontal>Or</Divider>
                <div>
                  <Popup
                    content={
                      <div>
                        <h4>Add csv</h4> Add the usernames in CSV file and
                        upload it.
                        <br />
                        <b>CSV file format:</b>
                        <img src={format} />
                      </div>
                    }
                    on="click"
                    pinned
                    position="bottom center"
                    trigger={
                      <Icon
                        name="info circle"
                        size="large"
                        style={{
                          cursor: "pointer",
                          marginBottom: 1,
                          float: "right",
                          color: "white"
                        }}
                      />
                    }
                  />
                </div>
                {this.state.file === false ? (
                  <label htmlFor="addcsv">
                    <div
                      className="drag_drop"
                      onDragLeave={e => {
                        document.getElementsByClassName(
                          "drag_drop"
                        )[0].style.border = "1px dashed rgb(196, 194, 194)";
                      }}
                      onDragOver={e => {
                        e.preventDefault();
                        document.getElementsByClassName(
                          "drag_drop"
                        )[0].style.border = "1px solid #000";
                      }}
                      onDrop={e => {
                        e.preventDefault();
                        console.log(e.dataTransfer.items[0].getAsFile());
                        this.addFile(e.dataTransfer.items[0].getAsFile());
                      }}
                    >
                      <img src={csv} />
                      <br />
                      Drop your csv file here
                      <input
                        type="file"
                        style={{ display: "none" }}
                        id="addcsv"
                        onChange={e => this.addFile(e.target.files[0])}
                      />
                    </div>
                  </label>
                ) : (
                  <React.Fragment>
                    <Table singleLine>
                      <Table.Header>
                        <Table.Row>
                          <Table.HeaderCell style={{ textAlign: "center" }}>
                            FileName
                          </Table.HeaderCell>
                          <Table.HeaderCell style={{ textAlign: "center" }}>
                            Status
                          </Table.HeaderCell>
                          <Table.Header />
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        <Table.Row>
                          <Table.Cell style={{ textAlign: "center" }}>
                            {this.state.file.name}
                          </Table.Cell>
                          <Table.Cell style={{ textAlign: "center" }}>
                            -
                          </Table.Cell>
                          <Table.Cell style={{ textAlign: "center" }}>
                            <Icon
                              name="minus circle"
                              style={{ cursor: "pointer", color: "#f46461" }}
                              onClick={() => this.setState({ file: false })}
                            />
                          </Table.Cell>
                        </Table.Row>
                      </Table.Body>
                    </Table>
                  </React.Fragment>
                )}
                <Divider />
                <div>
                  <Button
                    onClick={() => this.setState({ step: this.state.step + 1 })}
                    style={{
                      padding: 10,
                      float: "right"
                    }}
                  >
                    Continue
                    <Icon name="chevron circle right" color="white" />
                  </Button>
                </div>
              </Card>
            </Grid.Column>
            <Grid.Column computer={3} tablet={1} mobile={1} />
          </Grid.Row>
        </Grid>
      </React.Fragment>
    );
  };
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
