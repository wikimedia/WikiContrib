import React, { Component } from 'react';
import { fetchAsynchronous } from './components/fetch';
import fetchFileAsynchronous from './components/fetchFile';
import MessageDisplay from './components/message';
import { Redirect } from 'react-router-dom';
import { QueryCreateApi, QueryDetailApi } from './api';
import csv from './img/csv.png';
import format from './img/format.png';
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
  Header,
} from 'semantic-ui-react';
import { tool_name } from './App';
import { NavBar } from './components/nav';

var emptyObj = {
  fullname: '',
  gerrit_username: '',
  phabricator_username: '',
  github_username: '',
};

/**
 * Create or Update Query
 */
export class Query extends Component {
  constructor(props) {
    super(props);
    let type;
    if (process.env.NODE_ENV === 'production') {
      type =
        this.props.location.pathname === tool_name + '/' ||
        this.props.location.pathname === tool_name
          ? true
          : false;
    } else {
      type =
        this.props.location.pathname === '/' ||
        this.props.location.pathname === ''
          ? true
          : false;
    }
    this.state = {
      step: 1,
      rows:
        localStorage.getItem('users') !== null && type
          ? JSON.parse(localStorage.getItem('users'))
          : [Object.assign({}, emptyObj)],
      message: {
        message: '',
        type: '',
        update: false,
        trigger: false,
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
      bulkTooltipShown: false,
      // whether the bulk info has been shown for the first time
      bulkShown: false,
      visible: false,
      loadData: false,
      notfound: false,
    };
  }

  componentDidUpdate() {
      if (!this.state.bulkTooltipShown && (this.state.bulk))
        setTimeout(() => this.setState({ bulkTooltipShown: true }), 10000)
  }

  componentDidMount = () => {
    if (!this.state.operation) {
      fetchAsynchronous(
        QueryDetailApi.replace('<hash>', this.props.match.params.hash),
        'GET',
        undefined,
        {},
        this.displayData
      );
    }

    this.setState({ visible: true, notfound: false });
  };

  set = obj => {
    /**
     * Update the state of current component through the child components.
     * @param {Object} obj Object with all the updated params of the current state.
     */
    this.setState(obj);
  };

  displayData = response => {
    /**
     * Callback function that feeds the current state with the data of users(fetched through the Api)
     *  while updating the query.
     * @param {Object} response List of Users (or) CSV file returned by the API.
     */
    if (response.error === 1) {
      this.setState({ notfound: true });
    } else {
      if (response.file === 0) {
        this.setState({
          file: {
            name: this.props.match.params.hash + '.csv',
            uri: response.hash,
          },
          bulk: true,
          progress: false,
        });
      } else {
        this.setState({
          rows: response.users,
          bulk: false,
          progress: false,
          original_users: response.users,
        });
      }
    }
  };

  handlChange = (name, value, index) => {
    /**
     * Every time the users are updated, Add to localstorage.
     * @param {String} name
     * @param {String} value Updated value.
     * @param {Integer} index Tabular Index at which the value is updated.
     */
    let rows = [...this.state.rows];
    rows[index][name] = value;
    if (
      this.state.operation &&
      !(
        this.state.rows.length === 1 &&
        JSON.stringify(this.state.rows[0]) === JSON.stringify(emptyObj)
      )
    ) {
      localStorage.removeItem('users');
      localStorage.setItem('users', JSON.stringify(this.state.rows));
    }
    this.setState({ rows: rows });
  };

  addrow = () => {
    /**
     * Append row to the existing table.
     */
    let rows = [...this.state.rows];
    rows.push(Object.assign({}, emptyObj));

    this.setState({ rows: rows });
  };

  removeRow = index => {
    /**
     * Remove row from the existing table.
     * @param {Integer} index Index of the row to be removed in the table.
     */
    if (index === 0 && this.state.rows.length === 1) {
      let message = Object.entries({}, this.state.message);
      if (JSON.stringify(this.state.rows[0]) === JSON.stringify(emptyObj)) {
        message['message'] = 'The table must contain atleast one row';
        message['trigger'] = true;
        message['type'] = 1;
        message['update'] = !this.state.message.update;
        this.setState({ message: message });
      } else {
        this.setState({ rows: [Object.assign({}, emptyObj)] });
      }
    } else {
      let rows = [...this.state.rows];
      rows.splice(index, 1);
      this.setState({ rows: rows });
      if (this.state.operation) {
        localStorage.setItem('users', JSON.stringify(rows));
      }
    }
  };

  addFile = file => {
    /**
     * Add CSV file to the tool.
     * @param {file} file file added to upload.
     */
    if(file.type === 'text/csv' ||
       file.type === "application/vnd.ms-excel" ||
       file.type === "text/plain" ||
       file.type === "text/x-csv" ||
       file.type === "application/csv" ||
       file.type === "application/x-csv" ||
       file.type === "text/comma-separated-values" ||
       file.type === "text/x-comma-separated-values" ||
       file.type === "text/tab-separated-values") {
      this.setState({ file: file });
    }
     else {
      document.getElementsByClassName('drag_drop')[0].style.border =
        '1px dashed rgb(196, 194, 194)';

      this.setState({
        message: {
          message: 'Only CSV files can be uploaded!',
          trigger: true,
          update: !this.state.message.update,
          type: 1,
        },
      });
    }
  };

  getExactRows = () => {
    /**
     * Caluclate count of Exact rows the user filled excluding empty rows.
     * @returns {Integer} count of rows.
     */
    let users = [];
    for (let i in this.state.rows) {
      if (JSON.stringify(this.state.rows[i]) !== JSON.stringify(emptyObj)) {
        users.push(this.state.rows[i]);
      }
    }
    return users;
  };

  errorCallback = () => {
    /**
     * Trigger if Internet is lost while uploading the data.
     */
    this.setState({
      error: true,
      loading: false,
      message: {
        message: 'Lost Internet connection, please re-upload the file',
        update: !this.state.message.update,
        type: 1,
        trigger: true,
      },
    });
  };

  createQuery = () => {
    /**
     * fetch the API to create / update Query.
     */
    let usernameEmptyAtRow = false,
      fullnameEmptyAtRow = false;
    let nonemptyRowExist = () => {
      let rv = false;
      for (let i = this.state.rows.length - 1; i >= 0; i--) {
        if (this.state.rows[i].fullname.length === 0) {
          fullnameEmptyAtRow = parseInt(i);
        }
        if (
          this.state.rows[i].gerrit_username.length === 0 &&
          this.state.rows[i].phabricator_username.length === 0
        ) {
          usernameEmptyAtRow = parseInt(i);
        }
        if (JSON.stringify(this.state.rows[i]) !== JSON.stringify(emptyObj)) {
          rv = true;
        }
      }
      return rv;
    };

    if (this.state.file !== false && nonemptyRowExist()) {
      this.setState({
        message: {
          message:
            'You can not upload csv file and provide users in single query',
          update: !this.state.message.update,
          trigger: true,
          type: 1,
        },
      });
    } else if (this.state.file === false && !nonemptyRowExist()) {
      this.setState({
        message: {
          message: 'To visualize contributions, please provide user(s) information above.',
          update: !this.state.message.update,
          trigger: true,
          type: 1,
        },
      });
    } else if (this.state.file === false && fullnameEmptyAtRow !== false) {
      fullnameEmptyAtRow += 1;
      this.setState({
        message: {
          message:
            'Full name cannot be left blank; it is missing in row ' +
            fullnameEmptyAtRow,
          update: !this.state.message.update,
          trigger: true,
          type: 1,
        },
      });
    } else if (this.state.file === false && usernameEmptyAtRow !== false) {
      usernameEmptyAtRow = usernameEmptyAtRow + 1;
      this.setState({
        message: {
          message:
            'Both Gerrit and Phabricator fields cannot be left blank. Provide username for one of these accounts in row ' +
            usernameEmptyAtRow,
          update: !this.state.message.update,
          trigger: true,
          type: 1,
        },
      });
    } else {
      localStorage.removeItem('users');
      localStorage.removeItem('res_users');
      localStorage.removeItem('res_query');
      this.setState({ loading: true, notfound: false });
      let uri = this.state.operation
        ? QueryCreateApi
        : QueryDetailApi.replace('<hash>', this.props.match.params.hash);
      if (this.state.file !== false) {
        fetchFileAsynchronous(
          this.state.file,
          this.state.operation ? 'POST' : 'PATCH',
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
          this.callback('');
        } else {
          let data = { file: -1 };
          data['users'] = this.getExactRows();
          this.setState({ loadData: true, notfound: false });
          fetchAsynchronous(
            uri,
            this.state.operation ? 'POST' : 'PATCH',
            data,
            { 'Content-Type': 'application/json' },
            this.callback
          );
        }
      }
    }
  };

  callback = response => {
    /**
     * Callback function to redirect on creating the Query.
     * @param {Object} response Response of the API.
     */

    if (
      response !== '' &&
      response !== 'error' in response &&
      response.error === 1
    ) {
      this.setState({
        loading: false,
        message: {
          message: response.message,
          trigger: true,
          type: 1,
          update: !this.state.message.update,
        },
      });
    } else {
      let hash = '';
      if (this.state.operation) {
        hash = response.query;
      } else {
        hash = this.props.match.params.hash;
      }
      this.setState({
        redirect:
          process.env.NODE_ENV === 'production' ? 'wikicontrib/' + hash : hash,
        loading: false,
        loadData: response,
      });
    }
  };

  render = () => {
    document.body.style.backgroundColor = '#f8f9fa';
    return (
      <React.Fragment>
        {this.state.redirect !== false ? (
          <Redirect
            to={{
              pathname: '/' + this.state.redirect + '/',
              data: this.state.loadData,
            }}
          />
        ) : (
          ''
        )}

        {this.state.loadData !== false ? (
          <Loader active>Loading</Loader>
        ) : (
          <React.Fragment>
            <NavBar />
            <MessageDisplay
              message={this.state.message.message}
              type={this.state.message.type}
              update={this.state.message.update}
              trigger={this.state.message.trigger}
            />
            <div style={{ marginTop: '8%' }} />
            <Grid>
              <Grid.Row>
                <Grid.Column computer={3} tablet={1} mobile={1} />
                <Grid.Column computer={10} tablet={14} mobile={14}>
                  {this.state.progress ? (
                    <Card className="query_create">
                      {this.state.bulk ? (
                        <React.Fragment>
                          <Placeholder fluid className="csv_load">
                            <Placeholder.Line className="placeholder_line" />
                          </Placeholder>
                          <div className="divide" />
                          <Placeholder className="load">
                            <Placeholder.Line className="placeholder_line" />
                          </Placeholder>
                        </React.Fragment>
                      ) : (
                        <React.Fragment>
                          <Placeholder fluid className="wide">
                            <Placeholder.Line className="placeholder_line" />
                          </Placeholder>
                          <Placeholder fluid className="wide">
                            <Placeholder.Line className="placeholder_line" />
                          </Placeholder>
                          <Placeholder fluid className="wide">
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
                        <Header className="title">WikiContrib</Header>
                        <h4 className="accounts">
                          Get the Contributions of your fellow Wikimedians,
                          showcase yourself! Visualize their contribs using
                          graphs over different time ranges.
                        </h4>
                        <Card className="query_create">
                          {this.state.bulk ? (
                            <React.Fragment>
                              <div style={{ marginBottom: 10 }}>
                                <Popup
                                  content={(
                                    this.state.bulkTooltipShown ? (
                                      <div>
                                        <h4>Add CSV</h4> Add the usernames in CSV
                                        file and upload it.
                                        <br />
                                        <b>CSV file format:</b>
                                        <img src={format} alt="CSV File format" />
                                      </div>
                                    ) : 'CSV info here'
                                  )}
                                  on="click"
                                  pinned
                                  open={this.state.bulkTooltipShown ? this.state.bulkShown : true}
                                  onOpen={() => this.setState({ bulkShown: true })}
                                  onClose={(event) => {
                                    // in case of bulkTooltipShown being false (currently open)
                                    // the event fired when click would be onClose
                                    if(this.state.bulkTooltipShown || (event.target.tagName.toLowerCase() !== 'i'))
                                      // if tooltip already finished, close normally
                                      this.setState({ bulkShown: false, bulkTooltipShown: true })
                                    else
                                      // if tooltip not finished,
                                      // we will not close
                                      // but set tooltip to be finished and show the info normally
                                      // (a click here means open the CSV info)
                                      this.setState({ bulkTooltipShown: true, bulkShown: true })
                                  }}
                                  // tooltip is top
                                  position={this.state.bulkTooltipShown ? "bottom center" : "top center"}
                                  trigger={
                                    <Icon
                                      name="info circle"
                                      size="large"
                                      className="info_csv"
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
                                        'drag_drop'
                                      )[0].style.border =
                                        '1px dashed rgb(196, 194, 194)';
                                    }}
                                    onDragOver={e => {
                                      e.preventDefault();
                                      document.getElementsByClassName(
                                        'drag_drop'
                                      )[0].style.border = '1px solid #878dcd';
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
                                          'drag_drop'
                                        )[0].style.border =
                                          '1px dashed rgb(196, 194, 194)';
                                      }
                                    }}
                                  >
                                    <img src={csv} alt="CSV file" />
                                    <br />
                                    Drop your CSV file here
                                    <input
                                      type="file"
                                      accept=".csv"
                                      style={{ display: 'none' }}
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
                                        color: 'red',
                                      }}
                                    >
                                      <Table.Row>
                                        <Table.HeaderCell className="csv_add">
                                          FileName
                                        </Table.HeaderCell>
                                        {this.state.loading ? (
                                          <Table.HeaderCell className="csv_add">
                                            Status
                                          </Table.HeaderCell>
                                        ) : (
                                          ''
                                        )}
                                        {this.state.loading ? (
                                          ''
                                        ) : (
                                          <Table.HeaderCell className="csv_add" />
                                        )}
                                      </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                      <Table.Row>
                                        <Table.Cell
                                          style={{
                                            textAlign: 'center',
                                          }}
                                        >
                                          <span title={this.state.file.name}>
                                            {this.state.file.name.length > 25
                                              ? this.state.file.name.slice(
                                                  0,
                                                  24
                                                ) + '..'
                                              : this.state.file.name}
                                          </span>
                                        </Table.Cell>
                                        {this.state.loading ? (
                                          <Table.Cell
                                            style={{ textAlign: 'center' }}
                                            width={8}
                                          >
                                            {!this.state.operation &&
                                            this.state.file.hasOwnProperty(
                                              'uri'
                                            ) ? (
                                              <span
                                                style={{ color: '#7ac142' }}
                                              >
                                                Uploaded!
                                              </span>
                                            ) : (
                                              <React.Fragment>
                                                {this.state.error ? (
                                                  <span
                                                    style={{ color: '#f46461' }}
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
                                                      marginTop: 18,
                                                    }}
                                                    active
                                                  />
                                                )}
                                              </React.Fragment>
                                            )}
                                          </Table.Cell>
                                        ) : (
                                          ''
                                        )}
                                        {this.state.loading ? (
                                          ''
                                        ) : (
                                          <Table.Cell
                                            style={{ textAlign: 'center' }}
                                          >
                                            <Icon
                                              name="minus circle"
                                              style={{
                                                cursor: 'pointer',
                                                color: '#fa5050',
                                                fontSize: '1rem',
                                              }}
                                              onClick={() => {
                                                this.setState({
                                                  file: false,
                                                  error: false,
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
                              <Table singleLine className="user_table">
                                <Table.Body>
                                  {this.state.rows.map((obj, index) => (
                                    <Table.Row key={index}>
                                      <Table.Cell
                                        style={{ textAlign: 'center' }}
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
                                        style={{ textAlign: 'center' }}
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
                                        style={{ textAlign: 'center' }}
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
                                        style={{ textAlign: 'center' }}
                                      >
                                        <Icon
                                          name="minus circle"
                                          style={{
                                            cursor: 'pointer',
                                            color: '#fa5050',
                                            fontSize: '1rem',
                                          }}
                                          onClick={() => this.removeRow(index)}
                                        />
                                      </Table.Cell>
                                    </Table.Row>
                                  ))}
                                </Table.Body>
                              </Table>
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
                            localStorage.removeItem('users');
                            this.setState({
                              message: {
                                message: 'Cleared the cache data!',
                                trigger: true,
                                type: 0,
                                update: !this.state.message.update,
                              },
                              rows: [Object.assign({}, emptyObj)],
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
