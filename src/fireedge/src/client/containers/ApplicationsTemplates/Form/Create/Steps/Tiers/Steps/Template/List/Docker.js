/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'

import { InputCode } from 'client/components/FormControl'

const DockerFile = ({ backButton, handleSetData, currentValue }) => (
  <>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {backButton}
      <h1 style={{ marginLeft: 5, flexGrow: 1 }}>Docker file</h1>
    </div>
    <InputCode
      mode="dockerfile"
      defaultValue={currentValue}
      onChange={(newValue) => handleSetData(newValue)}
    />
  </>
)

DockerFile.propTypes = {
  backButton: PropTypes.node,
  currentValue: PropTypes.string,
  handleSetData: PropTypes.func,
}

DockerFile.defaultProps = {
  backButton: null,
  currentValue: undefined,
  handleSetData: PropTypes.func,
}

export default DockerFile
