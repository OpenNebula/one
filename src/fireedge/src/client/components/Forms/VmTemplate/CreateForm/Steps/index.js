/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { reach } from 'yup'

import General, {
  STEP_ID as GENERAL_ID,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/General'
import ExtraConfiguration, {
  STEP_ID as EXTRA_ID,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import CustomVariables, {
  STEP_ID as CUSTOM_ID,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/CustomVariables'

import { jsonToXml, userInputsToArray } from 'client/models/Helper'
import {
  createSteps,
  isBase64,
  encodeBase64,
  getUnknownAttributes,
} from 'client/utils'

const Steps = createSteps([General, ExtraConfiguration, CustomVariables], {
  transformInitialValue: (vmTemplate, schema) => {
    const userInputs = userInputsToArray(vmTemplate?.TEMPLATE?.USER_INPUTS, {
      order: vmTemplate?.TEMPLATE?.INPUTS_ORDER,
    })

    const knownTemplate = schema.cast(
      {
        [GENERAL_ID]: { ...vmTemplate, ...vmTemplate?.TEMPLATE },
        [EXTRA_ID]: { ...vmTemplate?.TEMPLATE, USER_INPUTS: userInputs },
      },
      { stripUnknown: true, context: { [EXTRA_ID]: vmTemplate.TEMPLATE } }
    )

    const knownAttributes = {
      ...knownTemplate[GENERAL_ID],
      ...knownTemplate[EXTRA_ID],
    }

    // Set the unknown attributes to the custom variables section
    knownTemplate[CUSTOM_ID] = getUnknownAttributes(
      vmTemplate?.TEMPLATE,
      knownAttributes
    )

    // Get the custom vars from the context
    const knownContext = reach(schema, `${EXTRA_ID}.CONTEXT`).cast(
      vmTemplate?.TEMPLATE?.CONTEXT,
      { stripUnknown: true, context: { extra: vmTemplate.TEMPLATE } }
    )

    // Merge known and unknown context custom vars
    knownTemplate[EXTRA_ID].CONTEXT = {
      ...reach(schema, `${EXTRA_ID}.CONTEXT`).cast(
        vmTemplate?.TEMPLATE?.CONTEXT,
        { stripUnknown: true, context: { extra: vmTemplate.TEMPLATE } }
      ),
      ...getUnknownAttributes(vmTemplate?.TEMPLATE?.CONTEXT, knownContext),
    }

    return knownTemplate
  },
  transformBeforeSubmit: (formData) => {
    const {
      [GENERAL_ID]: { MODIFICATION: _, ...general } = {},
      [CUSTOM_ID]: customVariables = {},
      [EXTRA_ID]: {
        CONTEXT: { START_SCRIPT, ENCODE_START_SCRIPT, ...restOfContext },
        TOPOLOGY: { ENABLE_NUMA, ...restOfTopology },
        ...extraTemplate
      } = {},
    } = formData ?? {}

    const context = {
      ...restOfContext,
      // transform start script to base64 if needed
      [ENCODE_START_SCRIPT ? 'START_SCRIPT_BASE64' : 'START_SCRIPT']:
        ENCODE_START_SCRIPT && !isBase64(START_SCRIPT)
          ? encodeBase64(START_SCRIPT)
          : START_SCRIPT,
    }
    const topology = ENABLE_NUMA ? { TOPOLOGY: restOfTopology } : {}

    // add user inputs to context
    Object.keys(extraTemplate?.USER_INPUTS ?? {}).forEach((name) => {
      const isCapacity = ['MEMORY', 'CPU', 'VCPU'].includes(name)
      const upperName = String(name).toUpperCase()
      !isCapacity && (context[upperName] = `$${upperName}`)
    })

    return jsonToXml({
      ...customVariables,
      ...extraTemplate,
      ...general,
      ...topology,
      CONTEXT: context,
    })
  },
})

export default Steps
