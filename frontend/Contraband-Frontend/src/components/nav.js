import React from "react";
import { Icon, Menu, Popup } from "semantic-ui-react";
import { Link } from "react-router-dom";

class NavBar extends React.Component {
  constructor(props) {
    super(props);
    this.about_content = (
      <b>
        Contraband tool provides user activity from two platforms(Phabricator,
        Gerrit) and display it. It simply tracks the developer activity. You can
        also view the user contributions in form of github profile.
      </b>
    );
  }
  render = () => (
    <Menu secondary className="navbar">
      <Menu.Item name="Contraband" as={Link} to="/" className="navbar_header" />
      <Menu.Item position="right">
        <Menu.Item
          position="right"
          as={Link}
          to="/docs/"
          style={{ color: "white" }}
        >
          <Icon name="book" />
          Docs
        </Menu.Item>
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
