import React from "react";
import { fetchAsynchronous } from "./fetch";
import { searchUsers } from "../api";

class UserSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      display: false,
      list: []
    };
  }

  componentDidMount() {
    // document.addEventListener("click", e => {
    //   if (!document.getElementById("drop").contains(e.target)) {
    //     this.setState({ display: false });
    //   } else if (
    //     e.target.className === "dropdown-input" ||
    //     e.target.id === "input-div"
    //   ) {
    //     if (this.state.value !== "") {
    //       this.setState({ display: true });
    //     }
    //   }
    // });
  }

  APIRequest = value => {
    console.log("Came here to the api request");
    let uri = searchUsers.replace("<hash>", this.props.hash);
    uri += "?username=" + value;
    this.setState({ loading: true });
    fetchAsynchronous(uri, "GET", {}, {}, this.callback);
  };

  callback = response => {
    if (response.search == this.props.value) {
      if (response.users.length > 0) {
        this.setState({ list: response.users, loading: false });
      }
    }
  };

  update = value => {
    console.log("coming here");
    this.props.set({ search: value });
    if (value != "") {
      this.setState({ display: true });
    } else {
      console.log("came to the else part");
      this.setState({ display: false });
      this.APIRequest(value);
    }
  };

  handleClick = obj => {
    this.props.set({ value: obj });
    this.setState({ display: false });
  };

  render = () => (
    <React.Fragment>
      <div id="drop">
        <div className="dropdown">
          <div id="input-div">
            <input
              type="text"
              placeholder="Select User"
              className="dropdown-input"
              value={this.props.value}
              onChange={e => this.update(e.target.value)}
            />
          </div>
          {this.state.display ? (
            <React.Fragment>
              {this.state.loading ? (
                <div className="loading">
                  <h3>Loading..</h3>
                </div>
              ) : (
                <React.Fragment>
                  {this.state.list.length === 0 ? (
                    <div className="no_results">No results Found.</div>
                  ) : (
                    <ul>
                      {this.state.list.map((obj, ind) => (
                        <li key={ind} onClick={() => this.handleClick(obj)}>
                          {obj}
                        </li>
                      ))}
                    </ul>
                  )}
                </React.Fragment>
              )}
            </React.Fragment>
          ) : (
            ""
          )}
        </div>
      </div>
    </React.Fragment>
  );
}

export default UserSearch;
