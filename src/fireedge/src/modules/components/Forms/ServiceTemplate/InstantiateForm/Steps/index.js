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

import UserInputs, {
  STEP_ID as USERINPUTS_ID,
} from '@modules/components/Forms/ServiceTemplate/InstantiateForm/Steps/UserInputs'

import UserInputsRole, {
  STEP_ID as USERINPUTSROLE_ID,
} from '@modules/components/Forms/ServiceTemplate/InstantiateForm/Steps/UserInputsRole'

import Network, {
  STEP_ID as NETWORK_ID,
} from '@modules/components/Forms/ServiceTemplate/InstantiateForm/Steps/Network'

import Charter, {
  STEP_ID as CHARTER_ID,
} from '@modules/components/Forms/ServiceTemplate/InstantiateForm/Steps/Charters'

import { createSteps, parseVmTemplateContents } from '@UtilsModule'
import { groupServiceUserInputs } from '@modules/components/Forms/UserInputs'

const Steps = createSteps(
  (data) => {
    // Get and order user inputs
    const userInputsData = groupServiceUserInputs(data?.dataTemplate)

    // Two steps for user inputs, one for the user inputs defined in the service template and another for the user inputs defined in role templates and that are not defined in the service template
    return [
      General,
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
      Network,
      Charter,
    ].filter(Boolean)
  },
  {
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
        [USERINPUTSROLE_ID]: {},
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
        [USERINPUTSROLE_ID]: userInputsRoleData,
        [NETWORK_ID]: networkData,
        [CHARTER_ID]: charterData,
      } = formData

      const formatTemplate = {
        custom_attrs_values: Object.fromEntries(
          Object.entries({
            ...userInputsData,
            ...userInputsRoleData,
          }).map(([key, value]) => [key.toUpperCase(), String(value)])
        ),
        networks_values: networkData?.NETWORKS?.map((network) => ({
          [network?.name]: {
            [['existing', 'reserve'].includes(network?.tableType)
              ? 'id'
              : 'template_id']: network?.netid,
          },
        })),
        roles: formData?.roles?.map((role) => {
          delete role.vm_template_id_content

          return {
            ...role,
            vm_template_contents: parseVmTemplateContents(
              {
                vmTemplateContents: role?.vm_template_contents,
                customAttrsValues: { ...userInputsData, ...userInputsRoleData },
                schedActions: charterData.SCHED_ACTION,
              },
              false,
              true
            ),
          }
        }),
        name: generalData?.NAME,
        instances: generalData?.INSTANCES,
      }

      return formatTemplate
    },
  }
)

export default Steps
