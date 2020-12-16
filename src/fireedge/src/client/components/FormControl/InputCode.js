import * as React from 'react'
import { Box } from '@material-ui/core'
import AceEditor from 'react-ace'
import PropTypes from 'prop-types'
import 'ace-builds/src-noconflict/mode-json'
import 'ace-builds/src-noconflict/theme-github'

const { string } = PropTypes

const InputCode = ({ code, language, ...props }) => {
  const handleChange = newValue => {
    console.log('change', newValue)
  }

  return (
    <Box height="100%" minHeight={200}>
      <AceEditor
        style={{ border: '1px solid lightgray' }}
        wrapEnabled
        value={code}
        fontSize={16}
        mode="json"
        theme="github"
        width="100%"
        height="100%"
        // maxLines={Infinity}
        minLines={10}
        onChange={handleChange}
        name="form-control-code"
        showPrintMargin={false}
        editorProps={{ $blockScrolling: true }}
        setOptions={{
          useWorker: false,
          tabSize: 2
        }}
        {...props}
      />
    </Box>
  )
}

InputCode.propTypes = {
  code: string,
  language: string
}

InputCode.defaultProps = {
  code: '',
  language: 'json'
}

export default InputCode
