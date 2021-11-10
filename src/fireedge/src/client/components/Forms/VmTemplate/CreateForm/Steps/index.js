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
import General, { STEP_ID as GENERAL_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/General'
import ExtraConfiguration, { STEP_ID as EXTRA_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
// import { jsonToXml } from 'client/models/Helper'
import { userInputsToArray, userInputsToObject } from 'client/models/Helper'
import { createSteps, isBase64 } from 'client/utils'

const Steps = createSteps(
  [General, ExtraConfiguration],
  {
    transformInitialValue: (vmTemplate, schema) => ({
      ...schema.pick([GENERAL_ID]).cast({
        [GENERAL_ID]: { ...vmTemplate, ...vmTemplate?.TEMPLATE }
      }, { stripUnknown: true }),
      ...schema.pick([EXTRA_ID]).cast({
        [EXTRA_ID]: {
          ...vmTemplate?.TEMPLATE,
          USER_INPUTS: userInputsToArray(vmTemplate?.TEMPLATE?.USER_INPUTS)
        }
      }, { context: { [EXTRA_ID]: vmTemplate.TEMPLATE } })
    }),
    transformBeforeSubmit: formData => {
      const {
        [GENERAL_ID]: general = {},
        [EXTRA_ID]: { USER_INPUTS, CONTEXT, ...extraTemplate } = {}
      } = formData ?? {}

      // const templateXML = jsonToXml({ ...general, ...extraTemplate })
      // return { template: templateXML }

      const { START_SCRIPT, ENCODE_START_SCRIPT, ...restOfContext } = CONTEXT

      const context = {
        ...restOfContext,
        [ENCODE_START_SCRIPT ? 'START_SCRIPT_BASE64' : 'START_SCRIPT']:
          ENCODE_START_SCRIPT && !isBase64(START_SCRIPT)
            ? btoa(unescape(encodeURIComponent(START_SCRIPT)))
            : START_SCRIPT
      }

      const userInputs = userInputsToObject(USER_INPUTS)
      const inputsOrder = USER_INPUTS.map(({ name }) => name).join(',')

      return {
        ...general,
        ...extraTemplate,
        CONTEXT: context,
        USER_INPUTS: userInputs,
        INPUTS_ORDER: inputsOrder
      }
    }
  }
)

export default Steps
