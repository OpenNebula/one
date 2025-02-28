/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

import { VM_ACTIONS } from '@ConstantsModule'
import { ConsoleButton } from '@modules/components/Buttons'
import PropTypes from 'prop-types'
import { memo } from 'react'

const { VNC, RDP, SSH } = VM_ACTIONS
const CONNECTION_TYPES = [VNC, RDP, SSH]

const RowAction = memo(({ vm }) => (
  <>
    {CONNECTION_TYPES.map((connectionType) => (
      <ConsoleButton
        key={`${vm}-${connectionType}`}
        connectionType={connectionType}
        vm={vm}
      />
    ))}
  </>
))

RowAction.propTypes = {
  vm: PropTypes.object.isRequired,
}

RowAction.displayName = 'RowAction'

export default RowAction
