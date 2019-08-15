import React, { Component } from "react";
import { fetchAsynchronous } from "./components/fetch";
import fetchFileAsynchronous from "./components/fetchFile";
import MessageDisplay from "./components/message";
import { Redirect } from "react-router-dom";
import { QueryCreateApi, QueryDetailApi } from "./api";
import DataFrame from "dataframe-js";
import csv from "./img/csv.png";
import format from "./img/format.png";
import {
  Card,
  Grid,
  Table,
  Button,
  Icon,
  Popup,
  Progress,
  Placeholder,
  Checkbox,
  Transition,
  Loader,
  Header
} from "semantic-ui-react";
import { production } from "./App";

var emptyObj = {
  fullname: "",
  gerrit_username: "",
  phabricator_username: "",
  github_username: ""
};

export class Query extends Component {
  constructor(props) {
    console.log(props);
    super(props);
    let type;
    if (production) {
      type = this.props.location.pathname === "/contrabandapp/" ? true : false;
    } else {
      type = this.props.location.pathname === "/" ? true : false;
    }
    this.state = {
      step: 1,
      rows:
        localStorage.getItem("users") !== null
          ? JSON.parse(localStorage.getItem("users"))
          : [Object.assign({}, emptyObj)],
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
      original_users: [],
      bulk: false,
      visible: false,
      loadData: false,
      notfound: false
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

    this.setState({ visible: true, notfound: false });
  };

  set = obj => {
    this.setState(obj);
  };

  displayData = response => {
    if (response.error === 1) {
      this.setState({ notfound: true });
    } else {
      if (response.file === 0) {
        this.setState({
          file: {
            name: this.props.match.params.hash + ".csv",
            uri: response.hash
          },
          bulk: true,
          progress: false
        });
      } else {
        this.setState({
          rows: response.users,
          bulk: false,
          progress: false,
          original_users: response.users
        });
        localStorage.setItem("users", JSON.stringify(response.users));
      }
    }
  };

  handlChange = (name, value, index) => {
    let rows = [...this.state.rows];
    rows[index][name] = value;
    localStorage.removeItem("users");
    if (
      !(
        this.state.rows.length === 1 &&
        JSON.stringify(this.state.rows[0]) === JSON.stringify(emptyObj)
      )
    ) {
      localStorage.setItem("users", JSON.stringify(this.state.rows));
    }
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
      localStorage.setItem("users", JSON.stringify(rows));
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

  storeRows = query => {
    if (this.state.file === false) {
      let users = [];
      for (let i in this.state.rows) {
        users.append(i["username"]);
      }
      let store = { query: query, users: users };
      localStorage.setItem("users", store);
    } else {
      let df = DataFrame.fromCSV();
    }
  };

  createQuery = () => {
    localStorage.removeItem("users");
    localStorage.removeItem("res_users");
    localStorage.removeItem("res_query");
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
      this.setState({ loading: true, notfound: false });
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
          this.setState({ loadData: true, notfound: false });
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
      hash = response.query;
    } else {
      hash = this.props.match.params.hash;
    }
    this.setState({
      redirect: production ? "contrabandapp/" + hash : hash,
      loading: false,
      loadData: response
    });
  };

  render = () => {
    document.body.style.backgroundColor = "#f8f9fa";
    return (
      <React.Fragment>
        {this.state.redirect !== false ? (
          <Redirect
            to={{
              pathname: "/" + this.state.redirect + "/",
              data: this.state.loadData
            }}
          />
        ) : (
          ""
        )}
        {this.state.loadData !== false ? (
          <Loader active>Loading</Loader>
        ) : (
          <React.Fragment>
            {/* <NavBar /> */}

            <MessageDisplay
              message={this.state.message.message}
              type={this.state.message.type}
              update={this.state.message.update}
              trigger={this.state.message.trigger}
            />
            <div style={{ marginTop: "10%" }} />
            <Grid>
              <Grid.Row>
                <Grid.Column computer={3} tablet={1} mobile={1} />
                <Grid.Column computer={10} tablet={14} mobile={14}>
                  {this.state.progress ? (
                    <Card className="query_create">
                      {this.state.bulk ? (
                        <React.Fragment>
                          <Placeholder fluid style={{ height: 70, margin: 10 }}>
                            <Placeholder.Line className="placeholder_line" />
                          </Placeholder>
                          <div className="divide" />
                          <Placeholder fluid style={{ height: 20, margin: 10 }}>
                            <Placeholder.Line className="placeholder_line" />
                          </Placeholder>
                        </React.Fragment>
                      ) : (
                        <React.Fragment>
                          <Placeholder fluid style={{ height: 20, margin: 10 }}>
                            <Placeholder.Line className="placeholder_line" />
                          </Placeholder>
                          <Placeholder fluid style={{ height: 20, margin: 10 }}>
                            <Placeholder.Line className="placeholder_line" />
                          </Placeholder>
                          <Placeholder fluid style={{ height: 20, margin: 10 }}>
                            <Placeholder.Line className="placeholder_line" />
                          </Placeholder>
                        </React.Fragment>
                      )}
                    </Card>
                  ) : (
                    <Transition
                      visible={this.state.visible}
                      duration={500}
                      animation="fade"
                    >
                      <React.Fragment>
                        <Header className="title">Contraband</Header>
                        <Card className="query_create">
                          {this.state.bulk ? (
                            <React.Fragment>
                              <div style={{ marginBottom: 10 }}>
                                <h4
                                  style={{
                                    marginLeft: 10,
                                    display: "inline",
                                    color: "#878dcd"
                                  }}
                                />
                                <Popup
                                  content={
                                    <div>
                                      <h4>Add CSV</h4> Add the usernames in CSV
                                      file and upload it.
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
                                        color: "#222"
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
                                      )[0].style.border =
                                        "1px dashed rgb(196, 194, 194)";
                                    }}
                                    onDragOver={e => {
                                      e.preventDefault();
                                      document.getElementsByClassName(
                                        "drag_drop"
                                      )[0].style.border = "1px solid #878dcd";
                                    }}
                                    onDrop={e => {
                                      e.preventDefault();
                                      if (
                                        e.dataTransfer.items[0].getAsFile() !==
                                        null
                                      ) {
                                        this.addFile(
                                          e.dataTransfer.items[0].getAsFile()
                                        );
                                      } else {
                                        document.getElementsByClassName(
                                          "drag_drop"
                                        )[0].style.border =
                                          "1px dashed rgb(196, 194, 194)";
                                      }
                                    }}
                                  >
                                    <img src={csv} />
                                    <br />
                                    Drop your CSV file here
                                    <input
                                      type="file"
                                      accept=".csv"
                                      style={{ display: "none" }}
                                      id="addcsv"
                                      onChange={e =>
                                        this.addFile(e.target.files[0])
                                      }
                                    />
                                  </div>
                                </label>
                              ) : (
                                <React.Fragment>
                                  <Table singleLine className="user_table">
                                    <Table.Header
                                      style={{
                                        color: "red"
                                      }}
                                    >
                                      <Table.Row>
                                        <Table.HeaderCell
                                          style={{
                                            textAlign: "center",
                                            color: "white",
                                            background: "#878dcd"
                                          }}
                                        >
                                          FileName
                                        </Table.HeaderCell>
                                        {this.state.loading ? (
                                          <Table.HeaderCell
                                            style={{
                                              textAlign: "center",
                                              color: "white",
                                              background: "#878dcd"
                                            }}
                                          >
                                            Status
                                          </Table.HeaderCell>
                                        ) : (
                                          ""
                                        )}
                                        {this.state.loading ? (
                                          ""
                                        ) : (
                                          <Table.HeaderCell
                                            style={{
                                              color: "white",
                                              background: "#878dcd"
                                            }}
                                          />
                                        )}
                                      </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                      <Table.Row>
                                        <Table.Cell
                                          style={{
                                            textAlign: "center"
                                          }}
                                        >
                                          <span title={this.state.file.name}>
                                            {this.state.file.name.length > 25
                                              ? this.state.file.name.slice(
                                                  0,
                                                  24
                                                ) + ".."
                                              : this.state.file.name}
                                          </span>
                                        </Table.Cell>
                                        {this.state.loading ? (
                                          <Table.Cell
                                            style={{ textAlign: "center" }}
                                            width={8}
                                          >
                                            {!this.state.operation &&
                                            this.state.file.hasOwnProperty(
                                              "uri"
                                            ) ? (
                                              <span
                                                style={{ color: "#7ac142" }}
                                              >
                                                Uploaded!
                                              </span>
                                            ) : (
                                              <React.Fragment>
                                                {this.state.error ? (
                                                  <span
                                                    style={{ color: "#f46461" }}
                                                  >
                                                    Error
                                                  </span>
                                                ) : (
                                                  <Progress
                                                    value={this.state.chunk}
                                                    total={this.state.chunks}
                                                    progress="percent"
                                                    precision={1}
                                                    indicating
                                                    style={{
                                                      marginTop: 18
                                                    }}
                                                    active
                                                  />
                                                )}
                                              </React.Fragment>
                                            )}
                                          </Table.Cell>
                                        ) : (
                                          ""
                                        )}
                                        {this.state.loading ? (
                                          ""
                                        ) : (
                                          <Table.Cell
                                            style={{ textAlign: "center" }}
                                          >
                                            <Icon
                                              name="minus circle"
                                              style={{
                                                cursor: "pointer",
                                                color: "#fa5050"
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
                            </React.Fragment>
                          ) : (
                            <div className="table_entry">
                              <h4
                                style={{
                                  marginLeft: 10,
                                  display: "inline",
                                  color: "#878dcd"
                                }}
                              />
                              <Table singleLine className="user_table">
                                <Table.Body>
                                  {this.state.rows.map((obj, index) => (
                                    <Table.Row key={index}>
                                      <Table.Cell
                                        style={{ textAlign: "center" }}
                                      >
                                        <input
                                          className="user_input"
                                          value={obj.fullname}
                                          name="fullname"
                                          placeholder="Full Name"
                                          onChange={e =>
                                            this.handlChange(
                                              e.target.name,
                                              e.target.value,
                                              index
                                            )
                                          }
                                        />
                                      </Table.Cell>
                                      <Table.Cell
                                        style={{ textAlign: "center" }}
                                      >
                                        <input
                                          className="user_input"
                                          value={obj.gerrit_username}
                                          name="gerrit_username"
                                          placeholder="Gerrit Username"
                                          onChange={e =>
                                            this.handlChange(
                                              e.target.name,
                                              e.target.value,
                                              index
                                            )
                                          }
                                        />
                                      </Table.Cell>
                                      <Table.Cell
                                        style={{ textAlign: "center" }}
                                      >
                                        <input
                                          className="user_input"
                                          value={obj.phabricator_username}
                                          name="phabricator_username"
                                          placeholder="Phabricator Username"
                                          onChange={e =>
                                            this.handlChange(
                                              e.target.name,
                                              e.target.value,
                                              index
                                            )
                                          }
                                        />
                                      </Table.Cell>
                                      <Table.Cell
                                        style={{ textAlign: "center" }}
                                      >
                                        <Icon
                                          name="minus circle"
                                          style={{
                                            cursor: "pointer",
                                            color: "#fa5050"
                                          }}
                                          onClick={() => this.removeRow(index)}
                                        />
                                      </Table.Cell>
                                    </Table.Row>
                                  ))}
                                </Table.Body>
                              </Table>
                              {/* <Button
                              icon
                              className="reset"
                              onClick={() => {
                                localStorage.removeItem("users");
                                this.setState({
                                  message: {
                                    message: "Cleared the cache data!",
                                    trigger: true,
                                    type: 0,
                                    update: !this.state.message.update
                                  },
                                  rows: [Object.assign({}, emptyObj)]
                                });
                              }}
                            >
                              <Icon
                                name="trash alternate"
                                style={{ paddingRight: 4 }}
                              />
                              Reset
                            </Button>

                            <Button
                              className="table_row_add"
                              onClick={this.addrow}
                            >
                              <Icon name="search" />
                            </Button>
                            <Button
                              className="table_row_add"
                              onClick={this.addrow}
                            >
                              <Icon name="user plus" />
                            </Button> */}
                            </div>
                          )}
                          <br />
                          <Card.Content extra>
                            <div>
                              <Checkbox
                                toggle
                                label="Bulk Add"
                                onClick={() =>
                                  this.setState({ bulk: !this.state.bulk })
                                }
                                checked={this.state.bulk}
                              />
                            </div>
                          </Card.Content>
                        </Card>
                        <Button
                          onClick={this.createQuery}
                          className="continue"
                          disabled={this.state.loading}
                          loading={this.state.loading}
                        >
                          <Icon name="search" />
                        </Button>
                        <Button className="table_row_add" onClick={this.addrow}>
                          <Icon name="user plus" />
                        </Button>
                        <Button
                          icon
                          className="reset"
                          onClick={() => {
                            localStorage.removeItem("users");
                            this.setState({
                              message: {
                                message: "Cleared the cache data!",
                                trigger: true,
                                type: 0,
                                update: !this.state.message.update
                              },
                              rows: [Object.assign({}, emptyObj)]
                            });
                          }}
                        >
                          <Icon
                            name="trash alternate"
                            style={{ paddingRight: 4 }}
                          />
                        </Button>
                      </React.Fragment>
                    </Transition>
                  )}
                </Grid.Column>
                <Grid.Column computer={3} tablet={1} mobile={1} />
              </Grid.Row>
            </Grid>
          </React.Fragment>
        )}
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
