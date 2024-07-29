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
// It uses the same schema and fields from AttachNic/QoS
import QOSOptions, {
  STEP_ID as QOS_ID,
} from 'client/components/Forms/Vm/AttachNicForm/Steps/QOSOptions'
import { createSteps } from 'client/utils'

const Steps = createSteps([QOSOptions], {
  transformInitialValue: (nic, schema) => {
    const {
      INBOUND_AVG_BW,
      INBOUND_PEAK_BW,
      INBOUND_PEAK_KB,
      OUTBOUND_AVG_BW,
      OUTBOUND_PEAK_BW,
      OUTBOUND_PEAK_KB,
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

    return {
      [QOS_ID]: castedValueQOS[QOS_ID],
    }
  },
  transformBeforeSubmit: (formData) => {
    const { [QOS_ID]: qos } = formData

    return qos
  },
})

export default Steps
