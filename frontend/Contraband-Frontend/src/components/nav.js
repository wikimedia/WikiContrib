import React from "react";
import { Menu, Button, Popup, Icon } from "semantic-ui-react";
import { info_content } from "./../api"

export const NavBar = () => (
    <Menu fluid secondary style={{ marginTop: -5 }}>
        <Menu.Menu position="right">
            <Menu.Item>
                <a target="_blank" href="https://wikicontrib.readthedocs.io/en/latest/">
                    <Button style={{ background: "#eaecf0", color: "#222", paddingLeft: 10, paddingRight: 8, marginRight: -25 }}>
                        <span style={{ marginRight: 5 }}>Docs</span> <Icon name="book" />
                    </Button>
                </a>
            </Menu.Item>
            <Menu.Item>
                <Popup
                    trigger={<Button icon="info" size="large" style={{ background: "#eaecf0", color: "#222", marginRight: -15 }}></Button>}
                    position='bottom right'
                    content={<div style={{ textAlign: "center" }}>
                        <span style={{ fontFamily: "Charter", fontWeight: "bold" }}>WikiContrib</span>
                        <br />
                        <p>{info_content}</p>
                    </div>}
                />
            </Menu.Item>
        </Menu.Menu>
    </Menu >
)