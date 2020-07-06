import React from 'react';
import { Box } from '@material-ui/core';
import AceEditor from 'react-ace';
import PropTypes from 'prop-types';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';

const { string } = PropTypes;

const InputCode = ({ code, language, ...props }) => {
  const handleChange = newValue => {
    console.log('change', newValue);
  };

  return (
    <Box border="1px solid lightgray">
      <AceEditor
        wrapEnabled
        value={code}
        fontSize={16}
        mode="json"
        theme="github"
        width="100%"
        maxLines={Infinity}
        minLines={50}
        onChange={handleChange}
        name="UNIQUE_ID_OF_DIV"
        showPrintMargin={false}
        editorProps={{ $blockScrolling: true }}
        setOptions={{
          useWorker: false,
          tabSize: 2
        }}
        {...props}
      />
    </Box>
  );
};

InputCode.propTypes = {
  code: string,
  language: string
};

InputCode.defaultProps = {
  code: '',
  language: 'json'
};

export default InputCode;
