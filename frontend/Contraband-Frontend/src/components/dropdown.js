import React from "react";
import { fetchAsynchronous } from "./fetch";
import { getUsers } from "../api";
import { Icon, Loader } from "semantic-ui-react";

class Dropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false
    };
  }

  render = () => {
    return (
      <div className="drop">
        <div style={{ position: "relative", margin: 10 }}>
          <div id="dropdown">
            <div style={{ display: "flex" }}>
              {this.props.loading ? (
                <Loader
                  inline={true}
                  active
                  size="mini"
                  style={{ marginTop: 3 }}
                />
              ) : (
                <Icon name="search" style={{ marginTop: 3 }} />
              )}
              <input
                onKeyPress={e => {
                  if (e.which == 13) {
                    this.props.onSearchChange();
                  }
                }}
                value={this.props.value}
                onChange={e => {
                  this.props.set({
                    message: "Press Enter to search",
                    strng: e.target.value
                  });
                }}
                onFocus={() => {
                  this.setState({ open: true });
                  this.props.set({ message: "Press Enter to search" });
                  document.querySelectorAll("div#dropdown")[0].style.border =
                    "1px solid lightblue";
                }}
                onBlur={e => {
                  setTimeout(() => {
                    this.setState({ open: false });
                    this.props.onClose();
                  }, 200);
                  document.querySelectorAll("div#dropdown")[0].style.border =
                    "1px solid #ede2e1";
                }}
                placeholder={this.state.open ? "" : this.props.placeholder}
                className="input_dropdown"
              />
            </div>
            {this.state.open ? (
              <div style={{ overflowY: "auto", maxHeight: "30vh" }}>
                {this.state.loading ? (
                  <div className="message_dropdown">
                    {this.props.noResultsMessage}
                  </div>
                ) : (
                  <React.Fragment>
                    {this.props.options.length == 0 ? (
                      <div className="message_dropdown">
                        {this.props.noResultsMessage}
                      </div>
                    ) : (
                      <React.Fragment>
                        {this.props.options.map((obj, ind) => (
                          <div
                            className="list_dropdown"
                            key={ind}
                            onClick={() => {
                              console.log("came here");
                              this.setState({ value: obj });
                              this.props.onChange(obj);
                            }}
                          >
                            {obj}
                          </div>
                        ))}
                      </React.Fragment>
                    )}
                  </React.Fragment>
                )}
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
    );
  };
}

class UserSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      list: [],
      strng: "",
      message: "Search Users in Query"
    };
  }

  getSearchedData = () => {
    if (this.state.strng !== "") {
      let rgx = new RegExp(this.state.strng, "i");
      let users = new Promise((resolve, reject) => {
        let data = localStorage.getItem("res_users").split(","),
          rv = [];
        for (let i of data) {
          if (rv.length > 50) {
            break;
          }
          if (rgx.test(i)) {
            rv.push(i);
          }
        }

        resolve(rv);
      });

      users.then(data => {
        let message = "";
        if (data.length === 0) {
          message = "No users Found";
        }
        this.setState({ list: data, loading: false, message: message });
      });
    } else {
      this.setState({ list: [], loading: false, message: "Search Users" });
    }
  };

  getList = () => {
    if (
      localStorage.getItem("res_query") !== null &&
      localStorage.getItem("res_query") === this.props.hash
    ) {
      this.getSearchedData();
    } else {
      this.setState({ loading: true });
      let uri = getUsers.replace("<hash>", this.props.hash);
      fetchAsynchronous(uri, "GET", {}, {}, this.callback);
    }
  };

  callback = response => {
    if (!response.hasOwnProperty("error") && response.error !== 1) {
      localStorage.setItem("res_users", response.users);
      localStorage.setItem("res_query", this.props.hash);
    } else {
      localStorage.setItem("res_users", []);
    }

    this.getSearchedData();
  };

  set = obj => {
    this.setState(obj);
  };

  componentDidUpdate = (prevprops, prevstate) => {
    if (prevprops.value !== this.props.value && this.props.value === "") {
      this.setState({ strng: "" });
    }
  };

  render = () => (
    <React.Fragment>
      <div>
        <Dropdown
          value={this.state.strng}
          set={this.set}
          placeholder="Search Users in Query"
          options={this.state.list}
          noResultsMessage={this.state.message}
          loading={this.state.loading}
          onSearchChange={() => {
            this.setState(
              {
                loading: true,
                message: "Searching..",
                list: []
              },
              () => this.getList()
            );
          }}
          onChange={value => {
            this.setState({ strng: value });
            this.props.set({ value: value });
          }}
          onClose={() => this.setState({ list: [] })}
        />
      </div>
    </React.Fragment>
  );
}

export default UserSearch;
