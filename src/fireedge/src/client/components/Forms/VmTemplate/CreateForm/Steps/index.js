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
import { reach } from 'yup'

import CustomVariables, {
  STEP_ID as CUSTOM_ID,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/CustomVariables'
import ExtraConfiguration, {
  STEP_ID as EXTRA_ID,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import General, {
  STEP_ID as GENERAL_ID,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/General'

import { userInputsToArray } from 'client/models/Helper'
import { createSteps, getUnknownAttributes, decodeBase64 } from 'client/utils'

const Steps = createSteps([General, ExtraConfiguration, CustomVariables], {
  saveState: true,
  transformInitialValue: (vmTemplate, schema) => {
    const userInputs = userInputsToArray(vmTemplate?.TEMPLATE?.USER_INPUTS, {
      order: vmTemplate?.TEMPLATE?.INPUTS_ORDER,
    })

    const objectSchema = {
      [GENERAL_ID]: { ...vmTemplate, ...vmTemplate?.TEMPLATE },
      [EXTRA_ID]: {
        ...vmTemplate?.TEMPLATE,
        USER_INPUTS: userInputs,
      },
    }

    // cast CPU_MODEL/FEATURES
    if (vmTemplate?.TEMPLATE?.CPU_MODEL?.FEATURES) {
      objectSchema[EXTRA_ID].CPU_MODEL = {
        ...vmTemplate?.TEMPLATE?.CPU_MODEL,
        FEATURES: (vmTemplate?.TEMPLATE?.CPU_MODEL?.FEATURES ?? '').split(','),
      }
    }

    // cast FIRMWARE
    const firmware = vmTemplate?.TEMPLATE?.OS?.FIRMWARE
    if (firmware) {
      objectSchema[EXTRA_ID].OS = {
        ...vmTemplate?.TEMPLATE?.OS,
      }
    }

    // Decode script base 64
    if (vmTemplate?.TEMPLATE?.CONTEXT?.START_SCRIPT_BASE64) {
      objectSchema[EXTRA_ID].CONTEXT = {
        ...vmTemplate.TEMPLATE.CONTEXT,
        START_SCRIPT: decodeBase64(
          vmTemplate?.TEMPLATE?.CONTEXT?.START_SCRIPT_BASE64
        ),
        ENCODE_START_SCRIPT: true,
      }
    }

    // Transform FILES_DS on CONTEXT
    if (vmTemplate?.TEMPLATE?.CONTEXT?.FILES_DS) {
      objectSchema[EXTRA_ID].CONTEXT = {
        ...objectSchema[EXTRA_ID].CONTEXT,
        FILES_DS: vmTemplate?.TEMPLATE?.CONTEXT?.FILES_DS.split(' '),
      }
    }

    // Transform INIT_SCRIPTS on CONTEXT
    if (vmTemplate?.TEMPLATE?.CONTEXT?.INIT_SCRIPTS) {
      objectSchema[EXTRA_ID].CONTEXT = {
        ...objectSchema[EXTRA_ID].CONTEXT,
        INIT_SCRIPTS: vmTemplate?.TEMPLATE?.CONTEXT?.INIT_SCRIPTS.split(' '),
      }
    }

    // Init GRPAHICS.TYPE
    const type = vmTemplate?.TEMPLATE?.GRAPHICS?.TYPE === 'VNC'
    if (type) {
      objectSchema[EXTRA_ID].GRAPHICS = {
        ...vmTemplate?.GRAPHICS,
        TYPE: type,
      }
    }

    const knownTemplate = schema.cast(objectSchema, {
      stripUnknown: true,
      context: { ...vmTemplate, [EXTRA_ID]: vmTemplate.TEMPLATE },
    })

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
      objectSchema[EXTRA_ID].CONTEXT,
      {
        stripUnknown: true,
        context: {
          ...vmTemplate,
          [EXTRA_ID]: vmTemplate.TEMPLATE,
        },
      }
    )

    // Merge known and unknown context custom vars
    knownTemplate[EXTRA_ID].CONTEXT = {
      ...knownContext,
      ...getUnknownAttributes(vmTemplate?.TEMPLATE?.CONTEXT, knownContext),
    }

    return knownTemplate
  },
  transformBeforeSubmit: (formData) =>
    // All formatting and parsing is taken care of in the VmTemplate container
    formData,
})

export default Steps
