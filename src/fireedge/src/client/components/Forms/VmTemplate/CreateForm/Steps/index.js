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
import { jsonToXml, userInputsToArray } from 'client/models/Helper'
import { createSteps, isBase64 } from 'client/utils'

const Steps = createSteps(
  [General, ExtraConfiguration],
  {
    transformInitialValue: (vmTemplate, schema) => {
      const generalStep = schema
        .pick([GENERAL_ID])
        .cast(
          { [GENERAL_ID]: { ...vmTemplate, ...vmTemplate?.TEMPLATE } },
          { stripUnknown: true }
        )

      const inputsOrder = vmTemplate?.TEMPLATE?.INPUTS_ORDER?.split(',') ?? []
      const userInputs = userInputsToArray(vmTemplate?.TEMPLATE?.USER_INPUTS)
        .sort((a, b) => inputsOrder.indexOf(a.name) - inputsOrder.indexOf(b.name))

      const configurationStep = schema
        .pick([EXTRA_ID])
        .cast(
          { [EXTRA_ID]: { ...vmTemplate?.TEMPLATE, USER_INPUTS: userInputs } },
          { stripUnknown: true, context: { [EXTRA_ID]: vmTemplate.TEMPLATE } }
        )

      return { ...generalStep, ...configurationStep }
    },
    transformBeforeSubmit: formData => {
      const {
        [GENERAL_ID]: general = {},
        [EXTRA_ID]: {
          USER_INPUTS,
          CONTEXT: { START_SCRIPT, ENCODE_START_SCRIPT, ...restOfContext },
          ...extraTemplate
        } = {}
      } = formData ?? {}

      const context = {
        ...restOfContext,
        // transform start script to base64 if needed
        [ENCODE_START_SCRIPT ? 'START_SCRIPT_BASE64' : 'START_SCRIPT']:
          ENCODE_START_SCRIPT && !isBase64(START_SCRIPT)
            ? btoa(unescape(encodeURIComponent(START_SCRIPT)))
            : START_SCRIPT
      }

      // add user inputs to context
      const userInputsNames = Object.keys(USER_INPUTS).forEach(name => {
        const upperName = String(name).toUpperCase()
        context[upperName] = `$${upperName}`
      })

      return jsonToXml({
        ...extraTemplate,
        ...general,
        CONTEXT: context,
        USER_INPUTS: USER_INPUTS
      })
    }
  }
)

export default Steps
