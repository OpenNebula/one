import React from 'react';
import PropTypes from 'prop-types';

function ImportDockerFile({ backButton }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {backButton}
      <h1 style={{ marginLeft: 5, flexGrow: 1 }}>Docker file</h1>
    </div>
  );
}

ImportDockerFile.propTypes = {
  backButton: PropTypes.node
};

ImportDockerFile.defaultProps = {
  backButton: null
};

export default ImportDockerFile;
