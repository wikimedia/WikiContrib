import React from 'react';
import { Menu, Button, Popup, Icon } from 'semantic-ui-react';
import { info_content } from './../api';

export const NavBar = () => (
  <Menu fluid secondary style={{ marginTop: -5 }}>
    <Menu.Menu position="right">
      <Menu.Item>
        <a className="a docs"
        aria-label="read the documentation"
          target="_blank"
          href="https://wikicontrib.readthedocs.io/en/latest/"
          rel="noopener noreferrer"
        >
            <span style={{ marginRight: 5 }}>Docs</span> <Icon name="book" />
        </a>
      </Menu.Item>
      <Menu.Item>
        <Popup
          trigger={<Button icon="info" aria-label="about wikicontrib" tabIndex="0" size="large" className="info"></Button>}
          position="bottom right"
          content={
            <div id="info_content" style={{ textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'Charter', fontWeight: 'bold' }}>
                WikiContrib
              </h2>
              <p>{info_content}</p>
            </div>
          }
        />
      </Menu.Item>
    </Menu.Menu>
  </Menu>
);
