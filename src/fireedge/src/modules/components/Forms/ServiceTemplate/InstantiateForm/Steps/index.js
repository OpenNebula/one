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

import Charter, {
  STEP_ID as CHARTER_ID,
} from '@modules/components/Forms/ServiceTemplate/InstantiateForm/Steps/Charters'

import { createSteps } from '@UtilsModule'
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
      Charter,
    ].filter(Boolean)
  },
  {
    transformInitialValue: (ServiceTemplate, schema) => {
      const { NAME } = ServiceTemplate
      const {
        TEMPLATE: { BODY: { sched_actions: schedActions = [] } = {} } = {},
      } = ServiceTemplate

      const knownTemplate = schema.cast({
        [GENERAL_ID]: { NAME },
        [USERINPUTS_ID]: {},
        [USERINPUTSROLE_ID]: {},
        [CHARTER_ID]: { SCHED_ACTION: schedActions },
      })

      return { ...knownTemplate }
    },

    transformBeforeSubmit: (formData) => {
      const {
        [GENERAL_ID]: generalData,
        [USERINPUTS_ID]: userInputsData,
        [CHARTER_ID]: charterData,
      } = formData

      const userInputsValues = Object.fromEntries(
        Object.entries({
          ...userInputsData,
        }).map(([key, value]) => [key.toUpperCase(), String(value)])
      )

      const formatTemplate = {
        user_inputs_values: userInputsValues, // Applied across all roles
        name: generalData?.NAME,
        instances: generalData?.INSTANCES,
        ...charterData,
      }

      return formatTemplate
    },
  }
)

export default Steps
