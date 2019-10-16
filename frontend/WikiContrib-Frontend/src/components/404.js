import React from 'react';
import emoji from '../img/oh.png';

/**
 * 404 Component
 */
class NotFound extends React.Component {
  render = () => (
    <React.Fragment>
      {'add_spacing' in this.props ? <div style={{ marginTop: '10em' }} /> : ''}

      <div className="notFound">
        <img src={emoji} alt="404 Not Found" />
        <h1>OOps!!</h1>
        <h1>404</h1>
        <h3>
          The page you are trying to search could not be found on the server.
        </h3>
      </div>
    </React.Fragment>
  );
}

export default NotFound;
