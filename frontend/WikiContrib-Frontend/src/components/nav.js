import React from 'react';
import { Menu, Button, Popup, Icon, Header } from 'semantic-ui-react';
import { info_content } from './../api';
import logo from '../img/wikimedia_logo.png';

export const NavBar = () => (
  <Menu fluid secondary style={{ marginTop: 0, background: "#000000", paddingTop: '2rem', paddingBottom: '2rem' }}>
    <Menu.Menu position='left' style={{ marginLeft: '5rem' }}>
      <Menu.Item>
        <img className='img-responsive' src={logo} style={{width: '6rem', height: '6rem'}} />
      </Menu.Item>
      <Menu.Item header>
        <a href="https://tools.wmflabs.org/wikicontrib/">
          <Header className='title' style={{ color: '#ffffff' }}>WikiContrib</Header>
        </a>
      </Menu.Item>
    </Menu.Menu>
    <Menu.Menu position="right" style={{ marginRight: '2rem' }}>
      <Menu.Item>
        <Popup
          content="Documentation"
          position='bottom center'
          trigger={
            <a className="a docs"
              aria-label="read the documentation"
              target="_blank"
              href="https://wikicontrib.readthedocs.io/en/latest/"
              rel="noopener noreferrer"
            >
              <span style={{ marginRight: 5 }}>Docs</span> <Icon name="book" />
            </a>
          }
        />
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
