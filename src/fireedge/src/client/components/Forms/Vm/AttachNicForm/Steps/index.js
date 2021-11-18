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
import NetworksTable, { STEP_ID as NETWORK_ID } from 'client/components/Forms/Vm/AttachNicForm/Steps/NetworksTable'
import AdvancedOptions, { STEP_ID as ADVANCED_ID } from 'client/components/Forms/Vm/AttachNicForm/Steps/AdvancedOptions'
import { createSteps } from 'client/utils'

const Steps = createSteps(
  [NetworksTable, AdvancedOptions],
  {
    transformInitialValue: nic => {
      const {
        NETWORK,
        NETWORK_ID: ID,
        NETWORK_UID,
        NETWORK_UNAME,
        SECURITY_GROUPS,
        ...rest
      } = nic ?? {}

      return {
        [NETWORK_ID]: [{
          ...nic,
          ID,
          NAME: NETWORK,
          UID: NETWORK_UID,
          UNAME: NETWORK_UNAME,
          SECURITY_GROUPS
        }],
        [ADVANCED_ID]: rest
      }
    },
    transformBeforeSubmit: formData => {
      const { [NETWORK_ID]: [network] = [], [ADVANCED_ID]: advanced } = formData
      const { ID, NAME, UID, UNAME, SECURITY_GROUPS } = network ?? {}

      return {
        NETWORK_ID: ID,
        NETWORK: NAME,
        NETWORK_UID: UID,
        NETWORK_UNAME: UNAME,
        SECURITY_GROUPS,
        ...advanced
      }
    }
  }
)

export default Steps
