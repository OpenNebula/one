/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
/* eslint-disable jsdoc/require-jsdoc */
import * as React from 'react'
import { Box } from '@material-ui/core'
import AceEditor from 'react-ace'
import PropTypes from 'prop-types'
import 'ace-builds/src-noconflict/mode-json'
import 'ace-builds/src-noconflict/theme-github'

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
  code: PropTypes.string,
  language: PropTypes.string
}

InputCode.defaultProps = {
  code: '',
  language: 'json'
}

export default InputCode
