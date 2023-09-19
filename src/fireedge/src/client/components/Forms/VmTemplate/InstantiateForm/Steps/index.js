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
import BasicConfiguration, {
  STEP_ID as BASIC_ID,
} from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/BasicConfiguration'
import ExtraConfiguration, {
  STEP_ID as EXTRA_ID,
} from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration'
import UserInputs, {
  STEP_ID as USER_INPUTS_ID,
} from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/UserInputs'
import { jsonToXml, userInputsToArray } from 'client/models/Helper'
import { createSteps } from 'client/utils'

const Steps = createSteps(
  (vmTemplate) => {
    const userInputs = userInputsToArray(vmTemplate?.TEMPLATE?.USER_INPUTS, {
      order: vmTemplate?.TEMPLATE?.INPUTS_ORDER,
    })

    return [
      BasicConfiguration,
      !!userInputs.length && (() => UserInputs(userInputs)),
      ExtraConfiguration,
    ].filter(Boolean)
  },
  {
    transformInitialValue: (vmTemplate, schema) => {
      const initialValue = schema.cast(
        {
          [BASIC_ID]: vmTemplate?.TEMPLATE,
          [EXTRA_ID]: vmTemplate?.TEMPLATE,
        },
        { stripUnknown: true }
      )

      return initialValue
    },
    transformBeforeSubmit: (formData, vmTemplate, _, adminGroup, oneConfig) => {
      const {
        [BASIC_ID]: { name, instances, hold, persistent, ...restOfConfig } = {},
        [USER_INPUTS_ID]: userInputs,
        [EXTRA_ID]: extraTemplate = {},
      } = formData ?? {}

      vmTemplate?.TEMPLATE?.OS &&
        extraTemplate?.OS &&
        (extraTemplate.OS = {
          ...vmTemplate?.TEMPLATE?.OS,
          ...extraTemplate?.OS,
        })

      // merge with template disks to get TYPE attribute
      const templateXML = jsonToXml({
        ...userInputs,
        ...extraTemplate,
        ...restOfConfig,
      })

      const data = { instances, hold, persistent, template: templateXML }

      const templates = [...new Array(instances)].map((__, idx) => ({
        id: vmTemplate.ID,
        name: name?.replace(/%idx/gi, idx),
        ...data,
      }))

      return templates
    },
  }
)

export default Steps
