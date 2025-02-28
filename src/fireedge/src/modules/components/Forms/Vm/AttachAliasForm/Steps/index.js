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
import NetworksTable, {
  STEP_ID as NETWORK_ID,
} from '@modules/components/Forms/Vm/AttachNicForm/Steps/NetworksTable'

import AdvancedOptions, {
  STEP_ID as ADVANCED_ID,
} from '@modules/components/Forms/Vm/AttachNicForm/Steps/AdvancedOptions'
import NetworkValues, {
  STEP_ID as NETWORK_VALUES_ID,
} from '@modules/components/Forms/Vm/AttachNicForm/Steps/NetworkValues'
import { createSteps } from '@UtilsModule'

const Steps = createSteps([NetworksTable, AdvancedOptions, NetworkValues], {
  transformInitialValue: (nic, schema) => {
    const {
      NETWORK,
      NETWORK_ID: ID,
      NETWORK_UID,
      NETWORK_UNAME,
      SECURITY_GROUPS,
      ...rest
    } = nic ?? {}

    const castedValue = schema.cast(
      { [ADVANCED_ID]: rest },
      { stripUnknown: true }
    )

    const castedNetworkValues = schema.cast(
      { [NETWORK_VALUES_ID]: rest },
      { stripUnknown: true }
    )

    return {
      [NETWORK_ID]: {
        NETWORK,
        NETWORK_UID,
        NETWORK_UNAME,
        SECURITY_GROUPS,
      },
      [ADVANCED_ID]: castedValue[ADVANCED_ID],
      [NETWORK_VALUES_ID]: castedNetworkValues[NETWORK_VALUES_ID],
    }
  },
  transformBeforeSubmit: (formData) => {
    const {
      [NETWORK_ID]: network,
      [ADVANCED_ID]: advanced,
      [NETWORK_VALUES_ID]: networkValues,
    } = formData

    return {
      ...network,
      ...advanced,
      ...networkValues,
    }
  },
})

export default Steps
