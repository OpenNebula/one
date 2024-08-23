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
import General, {
  STEP_ID as GENERAL_ID,
} from 'client/components/Forms/ServiceTemplate/InstantiateForm/Steps/General'

import UserInputs, {
  STEP_ID as USERINPUTS_ID,
} from 'client/components/Forms/ServiceTemplate/InstantiateForm/Steps/UserInputs'

import Network, {
  STEP_ID as NETWORK_ID,
} from 'client/components/Forms/ServiceTemplate/InstantiateForm/Steps/Network'

import Charter, {
  STEP_ID as CHARTER_ID,
} from 'client/components/Forms/ServiceTemplate/InstantiateForm/Steps/Charters'

import { createSteps, parseVmTemplateContents } from 'client/utils'

const Steps = createSteps([General, UserInputs, Network, Charter], {
  transformInitialValue: (ServiceTemplate, schema) => {
    const templatePath = ServiceTemplate?.TEMPLATE?.BODY
    const roles = templatePath?.roles ?? []

    const networks = Object.entries(templatePath?.networks ?? {}).map(
      ([key, value]) => {
        const extra = value.split(':').pop()

        return {
          netid: null,
          extra: extra,
          name: key,
        }
      }
    )

    // Get schedule actions from vm template contents
    const schedActions = parseVmTemplateContents(
      ServiceTemplate?.TEMPLATE?.BODY?.roles[0]?.vm_template_contents,
      true
    )?.schedActions

    const knownTemplate = schema.cast({
      [GENERAL_ID]: {},
      [USERINPUTS_ID]: {},
      [NETWORK_ID]: { NETWORKS: networks },
      [CHARTER_ID]: { SCHED_ACTION: schedActions },
    })

    const newRoles = roles.map((role) => {
      // Parse vm template content
      const roleTemplateContent = parseVmTemplateContents(
        role.vm_template_contents,
        true
      )

      // Delete schedule actions
      delete roleTemplateContent.schedActions

      // Parse content without sched actions
      const roleTemplateWithoutSchedActions = parseVmTemplateContents(
        roleTemplateContent,
        false
      )
      role.vm_template_contents = roleTemplateWithoutSchedActions

      // Return content
      return role
    })

    return { ...knownTemplate, roles: newRoles }
  },

  transformBeforeSubmit: (formData) => {
    const {
      [GENERAL_ID]: generalData,
      [USERINPUTS_ID]: userInputsData,
      [NETWORK_ID]: networkData,
      [CHARTER_ID]: charterData,
    } = formData

    const formatTemplate = {
      custom_attrs_values: Object.fromEntries(
        Object.entries(userInputsData).map(([key, value]) => [
          key.toUpperCase(),
          String(value),
        ])
      ),
      networks_values: networkData?.NETWORKS?.map((network) => ({
        [network?.name]: {
          [['existing', 'reserve'].includes(network?.tableType)
            ? 'id'
            : 'template_id']: network?.netid,
        },
      })),
      roles: formData?.roles?.map((role) => ({
        ...role,
        vm_template_contents: parseVmTemplateContents(
          {
            vmTemplateContents: role?.vm_template_contents,
            customAttrsValues: userInputsData,
            schedActions: charterData.SCHED_ACTION,
          },
          false,
          true
        ),
      })),
      name: generalData?.NAME,
    }

    return formatTemplate
  },
})

export default Steps
