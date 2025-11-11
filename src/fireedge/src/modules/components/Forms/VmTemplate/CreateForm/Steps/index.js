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
import { reach } from 'yup'

import CustomVariables, {
  STEP_ID as CUSTOM_ID,
} from '@modules/components/Forms/VmTemplate/CreateForm/Steps/CustomVariables'
import ExtraConfiguration, {
  STEP_ID as EXTRA_ID,
} from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import General, {
  STEP_ID as GENERAL_ID,
} from '@modules/components/Forms/VmTemplate/CreateForm/Steps/General'

import { T } from '@ConstantsModule'
import { userInputsToArray } from '@ModelsModule'
import { createSteps, decodeBase64, getUnknownAttributes } from '@UtilsModule'

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

    // Transform START_SCRIPT on CONTEXT
    if (vmTemplate?.TEMPLATE?.CONTEXT?.START_SCRIPT_BASE64) {
      objectSchema[EXTRA_ID].CONTEXT = {
        ...objectSchema[EXTRA_ID].CONTEXT,
        START_SCRIPT: decodeBase64(
          vmTemplate?.TEMPLATE?.CONTEXT?.START_SCRIPT_BASE64
        ),
        ENCODE_START_SCRIPT: true,
      }
    } else if (vmTemplate?.TEMPLATE?.CONTEXT?.START_SCRIPT) {
      objectSchema[EXTRA_ID].CONTEXT = {
        ...objectSchema[EXTRA_ID].CONTEXT,
        START_SCRIPT: vmTemplate?.TEMPLATE?.CONTEXT?.START_SCRIPT,
        ENCODE_START_SCRIPT: false,
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

    // Init GRAPHICS.TYPE
    const type = vmTemplate?.TEMPLATE?.GRAPHICS?.TYPE === 'VNC'
    if (type) {
      objectSchema[EXTRA_ID].GRAPHICS = {
        ...vmTemplate?.GRAPHICS,
        TYPE: type,
      }
    }

    // Transform DISK_COST to GB (core stores this value in MB)
    if (vmTemplate?.TEMPLATE?.DISK_COST) {
      objectSchema[GENERAL_ID].DISK_COST =
        +vmTemplate?.TEMPLATE?.DISK_COST * 1024
    }

    // Init placement
    const schedRequirements = vmTemplate?.TEMPLATE?.SCHED_REQUIREMENTS
    if (schedRequirements) {
      objectSchema[EXTRA_ID].SCHED_REQUIREMENTS = schedRequirements
      const parts = schedRequirements
        ?.split('&')
        ?.flatMap((part) => part.split('|'))
        ?.map((part) => part?.trim())

      const tableIds = parts?.reduce((ids, part) => {
        if (part?.includes('ID')) {
          const isCluster = part.toUpperCase().includes(T.Cluster.toUpperCase())
          const tableId = isCluster ? T.Cluster : T.Host
          const partId = [].concat(part?.match(/\d+/g))?.flat()?.pop()
          if (!partId) return ids
          ;(ids[tableId] ??= []).push(partId)
        }

        return ids
      }, {})

      if (tableIds?.[T.Cluster]) {
        objectSchema[EXTRA_ID].PLACEMENT_CLUSTER_TABLE = tableIds[T.Cluster]
      }

      if (tableIds?.[T.Host]) {
        objectSchema[EXTRA_ID].PLACEMENT_HOST_TABLE = tableIds[T.Host]
      }
    }

    const defaultType = T.SelectCluster
    objectSchema[EXTRA_ID].CLUSTER_HOST_TYPE = defaultType
    // Do not load a initial profile
    delete objectSchema.general.OS_PROFILE

    const knownTemplate = schema.cast(objectSchema, {
      stripUnknown: false,
      context: { ...vmTemplate, [EXTRA_ID]: vmTemplate.TEMPLATE },
    })

    // Second knownTemplate but with Attributes that will be Custom Variables
    const knownTemplateWithUnknown = schema.cast(objectSchema, {
      stripUnknown: true,
      context: { ...vmTemplate, [EXTRA_ID]: vmTemplate.TEMPLATE },
    })

    const knownAttributes = {
      ...knownTemplateWithUnknown[GENERAL_ID],
      ...knownTemplateWithUnknown[EXTRA_ID],
    }

    // Set the unknown attributes to the custom variables section
    const unkownAttributes = getUnknownAttributes(
      vmTemplate?.TEMPLATE,
      knownAttributes
    )

    knownTemplate[CUSTOM_ID] = unkownAttributes

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
  transformBeforeSubmit: (formData, initialValues) => {
    if (formData?.extra?.CONTEXT?.ENCODE_START_SCRIPT) {
      formData.extra.CONTEXT.START_SCRIPT_BASE64 =
        formData.extra.CONTEXT.START_SCRIPT
      delete formData.extra.CONTEXT.START_SCRIPT
      if (initialValues?.TEMPLATE?.CONTEXT?.START_SCRIPT) {
        formData.extra.CONTEXT.START_SCRIPT =
          initialValues.TEMPLATE.CONTEXT.START_SCRIPT
      }
    }
    delete formData.extra.CONTEXT.ENCODE_START_SCRIPT

    return formData
  },
})

export default Steps
