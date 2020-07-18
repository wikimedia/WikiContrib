import React from 'react';
import { Menu, Button, Popup, Icon } from 'semantic-ui-react';
import { info_content } from './../api';

export const NavBar = () => (
  <Menu fluid secondary style={{ marginTop: -5 }}>
    <Menu.Menu position="right">
      <Menu.Item className="nav-item">
        <Popup
          trigger={<Button icon="info" aria-label="about wikicontrib" tabIndex="0" size="large" className="info a source"></Button>}
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
      <Menu.Item className="nav-item">
        <a className="a source"
        aria-label="View source code on Github"
          target="_blank"
          href="https://github.com/wikimedia/wikicontrib"
          rel="noopener noreferrer"
        >
        <Icon name="code" />
        </a>
      </Menu.Item>
      <Menu.Item className="nav-item">
        <a className="a source"
          aria-label="Share your ideas or feedback on the tool's talk page on meta-wiki"
          target="_blank"
          href="https://meta.wikimedia.org/wiki/Talk:WikiContrib"
          rel="noopener noreferrer"
        >
        <Icon name="talk" />
        </a>
      </Menu.Item>
    </Menu.Menu>
  </Menu>
);
