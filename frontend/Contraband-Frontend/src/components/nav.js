import React from "react";
import { Icon, Menu, Popup, Button } from "semantic-ui-react";
import { Link } from "react-router-dom";
import { production } from "./../App";

class NavBar extends React.Component {
  constructor(props) {
    super(props);
    this.about_content = (
      <b>
        Contraband tool provides user activity from two platforms(Phabricator,
        Gerrit) and display it. It simply tracks the developer activity. You can
        also view the user contributions in form of github profile.
        <br />
        <Button as={Link} to="/docs/">
          Docs
        </Button>
      </b>
    );
  }
  render = () => (
    <Menu secondary className="navbar">
      <Menu.Item name="Contraband" as={Link} to="/" className="navbar_header" />
      <Menu.Item position="right">
        {"display" in this.props && this.props.display ? (
          <React.Fragment>
            <Menu.Item position="right" style={{ color: "white" }}>
              <Popup
                content={"Update the query"}
                position={"bottom center"}
                trigger={
                  <Button
                    as={Link}
                    className="navbar_buttons"
                    to={
                      production
                        ? "/contrabandapp/query/" +
                          this.props.query +
                          "/update/"
                        : "/query/" + this.props.query + "/update/"
                    }
                  >
                    <Icon name="redo" />
                    Update
                  </Button>
                }
              />
            </Menu.Item>
            <Menu.Item style={{ color: "white" }}>
              <Popup
                content={"Create new query"}
                position={"bottom center"}
                trigger={
                  <Button
                    as={Link}
                    to={production ? "/contrabandapp/" : "/"}
                    className="navbar_buttons"
                  >
                    <Icon name="plus circle" />
                    New
                  </Button>
                }
              />
            </Menu.Item>
          </React.Fragment>
        ) : (
          ""
        )}
        <Popup
          content={this.about_content}
          on="click"
          trigger={
            <Menu.Item position="right" style={{ color: "white" }}>
              <Icon name="question circle outline" />
            </Menu.Item>
          }
          position="bottom right"
        />
      </Menu.Item>
    </Menu>
  );
}

export default NavBar;
