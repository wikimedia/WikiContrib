import React from 'react';
import { Button, Popup, Icon } from 'semantic-ui-react';
import { info_content } from './../api';

export const NavBar = () => (
  <nav className="top-nav">
      <span className="nav-item">
        <Popup
          trigger={<Button icon="info" aria-label="about wikicontrib" tabIndex="0" className="source"></Button>}
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
      </span>
      <span className="nav-item">
        <a className="source"
        aria-label="View source code on Github"
          target="_blank"
          href="https://github.com/wikimedia/wikicontrib"
          rel="noopener noreferrer"
        >
        <Icon name="code" />
        </a>
      </span>
      <span className="nav-item">
        <a className="source"
          aria-label="Share your ideas or feedback on the tool's talk page on meta-wiki"
          target="_blank"
          href="https://meta.wikimedia.org/wiki/Talk:WikiContrib"
          rel="noopener noreferrer"
        >
        <Icon name="talk" />
        </a>
      </span>
    </nav>
);
