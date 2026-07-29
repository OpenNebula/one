/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
} from '@modules/resources/resources/VirtualMachine/Forms/AttachNicForm/Steps/NetworksTable'
import QOSOptions, {
  STEP_ID as QOS_ID,
} from '@modules/resources/resources/VirtualMachine/Forms/AttachNicForm/Steps/QOSOptions'
import AdvancedOptions, {
  STEP_ID as ADVANCED_ID,
} from '@modules/resources/resources/VirtualMachine/Forms/AttachNicForm/Steps/AdvancedOptions'
import NetworkAuto, {
  STEP_ID as NETWORK_AUTO_ID,
} from '@modules/resources/resources/VirtualMachine/Forms/AttachNicForm/Steps/NetworkAuto'
import NetworkValues, {
  STEP_ID as NETWORK_VALUES_ID,
} from '@modules/resources/resources/VirtualMachine/Forms/AttachNicForm/Steps/NetworkValues'

import { createSteps } from '@UtilsModule'

const Steps = createSteps(
  [AdvancedOptions, NetworksTable, NetworkAuto, NetworkValues, QOSOptions],
  {
    saveState: true,
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

      rest.NETWORK_MODE = rest.NETWORK_MODE?.toLowerCase?.() || 'network'

      const castedValue = schema.cast(
        {
          [ADVANCED_ID]: {
            ...rest,
            AUTO_VIRTIO_QUEUES: rest?.VIRTIO_QUEUES === 'auto',
          },
        },
        { stripUnknown: true }
      )

      const castedValueNetworkAuto = schema.cast(
        { [NETWORK_AUTO_ID]: rest },
        { stripUnknown: true }
      )

      const castedValueNetworkValues = schema.cast(
        { [NETWORK_VALUES_ID]: rest },
        { stripUnknown: true }
      )

      return {
        [NETWORK_ID]: NETWORK && {
          NETWORK,
          NETWORK_ID: ID,
          NETWORK_UID,
          NETWORK_UNAME,
          SECURITY_GROUPS,
        },
        [ADVANCED_ID]: castedValue[ADVANCED_ID],
        [QOS_ID]: castedValueQOS[QOS_ID],
        [NETWORK_AUTO_ID]: castedValueNetworkAuto[NETWORK_AUTO_ID],
        [NETWORK_VALUES_ID]: castedValueNetworkValues[NETWORK_VALUES_ID],
      }
    },
    transformBeforeSubmit: (formData) => {
      const {
        [NETWORK_ID]: network,
        [QOS_ID]: qos,
        [ADVANCED_ID]: advanced,
        [NETWORK_AUTO_ID]: networkAuto,
        [NETWORK_VALUES_ID]: networkValues,
      } = formData

      const { PCI_ADDRESS, PCI_SELECTION_MODE, PCI_TYPE, ...rAdvanced } =
        advanced
      const isDummy = rAdvanced.NETWORK_MODE === 'dummy'

      const pciAttrs = (() => {
        if (isDummy || PCI_TYPE === 'emulated' || !PCI_ADDRESS) return {}
        const [deviceClassVendor, shortAddr] = PCI_ADDRESS.split('@')
        const [d, c, v] = deviceClassVendor.split(':')

        return {
          ...(PCI_SELECTION_MODE === 'automatic'
            ? { DEVICE: d, CLASS: c, VENDOR: v }
            : { SHORT_ADDRESS: shortAddr }),
          TYPE: 'NIC',
          PCI_TYPE,
          PCI_ADDRESS,
          PCI_SELECTION_MODE,
        }
      })()

      return {
        ...(isDummy ? {} : network),
        ...(isDummy ? {} : qos),
        ...{
          ...rAdvanced,
          ...pciAttrs,
        },
        ...(isDummy ? {} : networkAuto),
        ...(isDummy ? { MAC: networkValues?.MAC } : networkValues),
      }
    },
  }
)

export default Steps
