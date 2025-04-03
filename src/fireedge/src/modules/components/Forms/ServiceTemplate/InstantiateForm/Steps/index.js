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
import General, {
  STEP_ID as GENERAL_ID,
} from '@modules/components/Forms/ServiceTemplate/InstantiateForm/Steps/General'

import NetworksStep, {
  STEP_ID as NETWORK_ID,
} from '@modules/components/Forms/ServiceTemplate/InstantiateForm/Steps/Networks'

import { SECTION_ID as NETWORKS_VALUES_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking/extraDropdown'

import UserInputs, {
  STEP_ID as USERINPUTS_ID,
} from '@modules/components/Forms/ServiceTemplate/InstantiateForm/Steps/UserInputs'

import UserInputsRole, {
  STEP_ID as USERINPUTSROLE_ID,
} from '@modules/components/Forms/ServiceTemplate/InstantiateForm/Steps/UserInputsRole'

import Charter, {
  STEP_ID as CHARTER_ID,
} from '@modules/components/Forms/ServiceTemplate/InstantiateForm/Steps/Charters'

import {
  createSteps,
  fromNetworkString,
  fromNetworksValueString,
  toNetworksValueString,
  toNetworkString,
} from '@UtilsModule'
import { groupServiceUserInputs } from '@modules/components/Forms/UserInputs'

const Steps = createSteps(
  (data) => {
    // Get and order user inputs
    const userInputsData = groupServiceUserInputs(data?.dataTemplate)

    // Has networks
    const networks = data?.dataTemplate?.TEMPLATE?.BODY?.networks

    // Two steps for user inputs, one for the user inputs defined in the service template and another for the user inputs defined in role templates and that are not defined in the service template
    return [
      General,
      networks && NetworksStep,
      userInputsData?.service?.userInputs?.length > 0 &&
        (() =>
          UserInputs(
            userInputsData.service.userInputs,
            userInputsData.service.userInputsLayout
          )),
      userInputsData?.roles?.userInputs?.length > 0 &&
        (() =>
          UserInputsRole(
            userInputsData.roles.userInputs,
            userInputsData.roles.userInputsLayout
          )),
      Charter,
    ].filter(Boolean)
  },
  {
    transformInitialValue: (ServiceTemplate, schema) => {
      const { NAME } = ServiceTemplate
      const {
        TEMPLATE: {
          BODY: {
            sched_actions: schedActions = [],
            networks = [],
            networks_values: networksValues = [],
          } = {},
        } = {},
      } = ServiceTemplate

      const networkParse = Object.entries(networks)?.reduce(
        (acc, network, idx) => {
          const res = []
          const parsedNetwork = fromNetworkString(network)

          const matchingNetworksValue = networksValues?.find(
            (nv) => Object.keys(nv)?.pop() === parsedNetwork?.name
          )

          if (matchingNetworksValue) {
            // Size goes to parsedNetworks...
            const { SIZE, ...parsedNetworksValue } = fromNetworksValueString(
              Object.values(matchingNetworksValue)
            )

            // Order matters
            res.push([{ ...parsedNetwork, SIZE }])
            res.push([parsedNetworksValue])
          } else {
            res.push([parsedNetwork])
          }

          acc[idx] = res

          return acc
        },
        []
      )

      const [parsedNetworks, parsedNetworksValues] = [
        networkParse.map(([pn]) => pn).flat(),
        networkParse.map(([, pnv]) => pnv).flat(),
      ]

      const knownTemplate = schema.cast({
        [GENERAL_ID]: { NAME },
        networks: {
          [NETWORK_ID]: parsedNetworks,
          [NETWORKS_VALUES_ID]: parsedNetworksValues,
        },
        [USERINPUTS_ID]: {},
        [USERINPUTSROLE_ID]: {},
        [CHARTER_ID]: { SCHED_ACTION: schedActions },
      })

      return { ...knownTemplate }
    },

    transformBeforeSubmit: (formData) => {
      const {
        [GENERAL_ID]: generalData,
        networks: {
          [NETWORK_ID]: networkData,
          [NETWORKS_VALUES_ID]: networksValues,
        },
        [USERINPUTS_ID]: userInputsData,
        [USERINPUTSROLE_ID]: userInputsRoleData,
        [CHARTER_ID]: charterData,
      } = formData

      const userInputsValues = Object.fromEntries(
        Object.entries({
          ...userInputsRoleData,
          ...userInputsData,
        }).map(([key, value]) => [key.toUpperCase(), String(value)])
      )

      const formatTemplate = {
        user_inputs_values: userInputsValues, // Applied across all roles
        name: generalData?.NAME,
        instances: generalData?.INSTANCES,
        networks: Object.fromEntries(networkData?.map(toNetworkString)) ?? [],
        networks_values: networkData
          ?.map((network, idx) =>
            toNetworksValueString(network, networksValues[idx])
          )
          ?.filter(Boolean),
        ...charterData,
      }

      return formatTemplate
    },
  }
)

export default Steps
