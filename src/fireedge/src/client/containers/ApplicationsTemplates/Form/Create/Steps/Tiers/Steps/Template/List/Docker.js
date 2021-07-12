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
import PropTypes from 'prop-types'

import AceEditor from 'react-ace'
import 'ace-builds/src-noconflict/mode-dockerfile'
import 'ace-builds/src-noconflict/theme-github'

const DockerFile = ({ backButton, handleSetData, currentValue, ...props }) => {
  const handleChange = newValue => {
    handleSetData(newValue)
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {backButton}
        <h1 style={{ marginLeft: 5, flexGrow: 1 }}>Docker file</h1>
      </div>
      <AceEditor
        style={{ border: '1px solid lightgray' }}
        wrapEnabled
        defaultValue={currentValue}
        fontSize={16}
        mode="dockerfile"
        theme="github"
        width="100%"
        height="100%"
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
    </>
  )
}

DockerFile.propTypes = {
  backButton: PropTypes.node,
  currentValue: PropTypes.string,
  handleSetData: PropTypes.func
}

DockerFile.defaultProps = {
  backButton: null,
  currentValue: undefined,
  handleSetData: PropTypes.func
}

export default DockerFile
