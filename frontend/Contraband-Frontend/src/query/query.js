import React, { Component } from "react";
import Stepper from "../components/stepper";
import { fetchAsynchronous } from "../components/fetch";
import fetchFileAsynchronous from "../components/fetchFile";
import MessageDisplay from "../components/message";
import { Redirect } from "react-router-dom";
import { QueryCreateApi, QueryDetailApi } from "../api";
import csv from "../img/csv.png";
import format from "../img/format.png";
import {
  Card,
  Grid,
  Divider,
  Table,
  Button,
  Icon,
  Popup,
  Progress,
  Placeholder
} from "semantic-ui-react";

var emptyObj = {
  fullname: "",
  gerrit_username: "",
  phabricator_username: "",
  github_username: ""
};

export class Query extends Component {
  constructor(props) {
    super(props);
    let type = this.props.location.pathname === "/" ? true : false;
    this.state = {
      step: 1,
      rows: [Object.assign({}, emptyObj)],
      message: {
        message: "",
        type: "",
        update: false,
        trigger: false
      },
      file: false,
      loading: false,
      redirect: false,
      chunk: 0,
      chunks: 0,
      error: false,
      /*
       * The 'operation' signifies the Query operation being perfomed,
       * True: Create a Query
       * False: Update a Query
       */
      operation: type,
      progress: !type,
      original_users: []
    };
  }

  componentDidMount = () => {
    if (!this.state.operation) {
      fetchAsynchronous(
        QueryDetailApi.replace("<hash>", this.props.match.params.hash),
        "GET",
        undefined,
        {},
        this.displayData
      );
    }
  };

  displayData = response => {
    if (response.error === 1) {
      this.setState({ redirect: "/404/" });
    } else {
      if (response.file === 0) {
        this.setState({
          file: {
            name: this.props.match.params.hash + ".csv",
            uri: response.hash
          },
          progress: false
        });
      } else {
        this.setState({
          rows: response.users,
          original_users: response.users,
          progress: false
        });
      }
    }
  };

  handlChange = (name, value, index) => {
    let rows = [...this.state.rows];
    rows[index][name] = value;
    this.setState({ rows: rows });
  };

  addrow = () => {
    let rows = [...this.state.rows];
    rows.push(Object.assign({}, emptyObj));

    this.setState({ rows: rows });
  };

  removeRow = index => {
    if (index === 0 && this.state.rows.length === 1) {
      let message = Object.entries({}, this.state.message);
      if (JSON.stringify(this.state.rows[0]) === JSON.stringify(emptyObj)) {
        message["message"] = "The table must contain atleast one row";
        message["trigger"] = true;
        message["type"] = 1;
        message["update"] = !this.state.message.update;
        this.setState({ message: message });
      } else {
        this.setState({ rows: [Object.assign({}, emptyObj)] });
      }
    } else {
      let rows = [...this.state.rows];
      rows.splice(index, 1);
      this.setState({ rows: rows });
    }
  };

  addFile = file => {
    if (file.type === "text/csv") {
      this.setState({ file: file });
    } else {
      document.getElementsByClassName("drag_drop")[0].style.border =
        "1px dashed rgb(196, 194, 194)";

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

  getExactRows = () => {
    let users = [];
    for (let i in this.state.rows) {
      if (JSON.stringify(this.state.rows[i]) !== JSON.stringify(emptyObj)) {
        users.push(this.state.rows[i]);
      }
    }
    return users;
  };

  errorCallback = () => {
    this.setState({
      error: true,
      loading: false,
      message: {
        message: "Lost Internet connection, please re-upload the file",
        update: !this.state.message.update,
        type: 1,
        trigger: true
      }
    });
  };

  createQuery = () => {
    let nonemptyRowExist = () => {
      let rv = false;
      for (let i in this.state.rows) {
        if (JSON.stringify(this.state.rows[i]) !== JSON.stringify(emptyObj)) {
          rv = true;
          break;
        }
      }
      return rv;
    };

    if (this.state.file !== false && nonemptyRowExist()) {
      this.setState({
        message: {
          message:
            "You can not upload csv file and provide users in single query",
          update: !this.state.message.update,
          trigger: true,
          type: 1
        }
      });
    } else if (this.state.file === false && !nonemptyRowExist()) {
      this.setState({
        message: {
          message: "Please provide the data regarding users.",
          update: !this.state.message.update,
          trigger: true,
          type: 1
        }
      });
    } else {
      this.setState({ loading: true });
      let uri = this.state.operation
        ? QueryCreateApi
        : QueryDetailApi.replace("<hash>", this.props.match.params.hash);
      if (this.state.file !== false) {
        fetchFileAsynchronous(
          this.state.file,
          this.state.operation ? "POST" : "PATCH",
          uri,
          this.callback,
          (chunk, chunks) => {
            this.setState({ chunk: chunk, chunks: chunks });
          },
          this.errorCallback
        );
      } else {
        if (
          this.state.original_users === this.state.rows &&
          !this.state.operation
        ) {
          this.callback("");
        } else {
          let data = { file: -1 };
          data["users"] = this.getExactRows();
          fetchAsynchronous(
            uri,
            this.state.operation ? "POST" : "PATCH",
            data,
            { "Content-Type": "application/json" },
            this.callback
          );
        }
      }
    }
  };

  callback = response => {
    let hash = "";
    if (this.state.operation) {
      hash = response.hash_code;
    } else {
      hash = this.props.match.params.hash;
    }
    this.setState({ redirect: hash, loading: false });
  };

  render = () => {
    return (
      <React.Fragment>
        {this.state.redirect !== false ? (
          <Redirect to={"/" + this.state.redirect + "/filters/add/"} />
        ) : (
          ""
        )}
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
              {this.state.progress ? (
                <Card className="query_create">
                  <Placeholder fluid style={{ height: 20, margin: 10 }}>
                    <Placeholder.Line className="placeholder_line" />
                  </Placeholder>
                  <Placeholder fluid style={{ height: 20, margin: 10 }}>
                    <Placeholder.Line className="placeholder_line" />
                  </Placeholder>
                  <Placeholder fluid style={{ height: 20, margin: 10 }}>
                    <Placeholder.Line className="placeholder_line" />
                  </Placeholder>
                  <Divider horizontal>Or</Divider>
                  <Placeholder fluid style={{ height: 70, margin: 10 }}>
                    <Placeholder.Line className="placeholder_line" />
                  </Placeholder>
                  <div className="divide" />
                  <Placeholder fluid style={{ height: 20, margin: 10 }}>
                    <Placeholder.Line className="placeholder_line" />
                  </Placeholder>
                </Card>
              ) : (
                <Card className="query_create">
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
                          if (e.dataTransfer.items[0].getAsFile() !== null) {
                            this.addFile(e.dataTransfer.items[0].getAsFile());
                          } else {
                            document.getElementsByClassName(
                              "drag_drop"
                            )[0].style.border = "1px dashed rgb(196, 194, 194)";
                          }
                        }}
                      >
                        <img src={csv} />
                        <br />
                        Drop your csv file here
                        <input
                          type="file"
                          accept=".csv"
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
                            {this.state.loading ? "" : <Table.HeaderCell />}
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          <Table.Row>
                            <Table.Cell style={{ textAlign: "center" }}>
                              <span title={this.state.file.name}>
                                {this.state.file.name.length > 25
                                  ? this.state.file.name.slice(0, 24) + ".."
                                  : this.state.file.name}
                              </span>
                            </Table.Cell>
                            <Table.Cell
                              style={{ textAlign: "center" }}
                              width={8}
                            >
                              {!this.state.operation &&
                              this.state.file.hasOwnProperty("uri") ? (
                                <span style={{ color: "#7ac142" }}>
                                  Uploaded!
                                </span>
                              ) : (
                                <React.Fragment>
                                  {this.state.error ? (
                                    <span style={{ color: "#f46461" }}>
                                      Error
                                    </span>
                                  ) : (
                                    <Progress
                                      value={this.state.chunk}
                                      total={this.state.chunks}
                                      progress="percent"
                                      precision={1}
                                      style={{ marginTop: 18 }}
                                      active
                                    />
                                  )}
                                </React.Fragment>
                              )}
                            </Table.Cell>
                            {this.state.loading ? (
                              ""
                            ) : (
                              <Table.Cell style={{ textAlign: "center" }}>
                                <Icon
                                  name="minus circle"
                                  style={{
                                    cursor: "pointer",
                                    color: "#f46461"
                                  }}
                                  onClick={() => {
                                    this.setState({
                                      file: false,
                                      error: false
                                    });
                                  }}
                                />
                              </Table.Cell>
                            )}
                          </Table.Row>
                        </Table.Body>
                      </Table>
                    </React.Fragment>
                  )}
                  <Divider />
                  <div>
                    <Button
                      onClick={this.createQuery}
                      style={{
                        padding: 10,
                        float: "right"
                      }}
                      loading={this.state.loading}
                    >
                      Continue
                      <Icon name="chevron circle right" />
                    </Button>
                  </div>
                </Card>
              )}
            </Grid.Column>
            <Grid.Column computer={3} tablet={1} mobile={1} />
          </Grid.Row>
        </Grid>
      </React.Fragment>
    );
  };
}

export class QueryDelete extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render = () => <React.Fragment>Query Update</React.Fragment>;
}
