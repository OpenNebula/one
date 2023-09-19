/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
} from 'client/components/Forms/Vm/AttachNicForm/Steps/NetworksTable'
import QOSOptions, {
  STEP_ID as QOS_ID,
} from 'client/components/Forms/Vm/AttachNicForm/Steps/QOSOptions'
import AdvancedOptions, {
  STEP_ID as ADVANCED_ID,
} from 'client/components/Forms/Vm/AttachNicForm/Steps/AdvancedOptions'
import { createSteps } from 'client/utils'

const Steps = createSteps([NetworksTable, AdvancedOptions, QOSOptions], {
  transformInitialValue: (nic, schema) => {
    const {
      NETWORK,
      NETWORK_ID: ID,
      NETWORK_UID,
      NETWORK_UNAME,
      SECURITY_GROUPS,
      INBOUND_AVG_BW,
      INBOUND_PEAK_BW,
      INBOUND_PEAK_KB,
      OUTBOUND_AVG_BW,
      OUTBOUND_PEAK_BW,
      OUTBOUND_PEAK_KB,
      ...rest
    } = nic ?? {}

    const castedValueQOS = schema.cast(
      {
        [QOS_ID]: {
          INBOUND_AVG_BW,
          INBOUND_PEAK_BW,
          INBOUND_PEAK_KB,
          OUTBOUND_AVG_BW,
          OUTBOUND_PEAK_BW,
          OUTBOUND_PEAK_KB,
        },
      },
      { stripUnknown: true }
    )

    const castedValue = schema.cast(
      { [ADVANCED_ID]: rest },
      { stripUnknown: true }
    )

    // #6154: Add temp id to propagate it
    if (rest.TEMP_ID) castedValue[ADVANCED_ID].TEMP_ID = rest.TEMP_ID

    return {
      [NETWORK_ID]: [
        {
          ...nic,
          ID,
          NAME: NETWORK,
          UID: NETWORK_UID,
          UNAME: NETWORK_UNAME,
          SECURITY_GROUPS,
        },
      ],
      [ADVANCED_ID]: castedValue[ADVANCED_ID],
      [QOS_ID]: castedValueQOS[QOS_ID],
    }
  },
  transformBeforeSubmit: (formData) => {
    const {
      [NETWORK_ID]: [network] = [],
      [QOS_ID]: qos,
      [ADVANCED_ID]: advanced,
    } = formData
    const { ID, NAME, UID, UNAME, SECURITY_GROUPS } = network ?? {}

    return {
      NETWORK_ID: ID,
      NETWORK: NAME,
      NETWORK_UID: UID,
      NETWORK_UNAME: UNAME,
      SECURITY_GROUPS,
      ...qos,
      ...advanced,
    }
  },
})

export default Steps
