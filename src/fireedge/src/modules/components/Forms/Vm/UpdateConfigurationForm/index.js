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
import ContentForm from '@modules/components/Forms/Vm/UpdateConfigurationForm/content'
import { SCHEMA } from '@modules/components/Forms/Vm/UpdateConfigurationForm/schema'
import {
  createForm,
  decodeBase64,
  getUnknownAttributes,
  isBase64,
} from '@UtilsModule'
import { set } from 'lodash'
import { reach } from 'yup'

const UpdateConfigurationForm = createForm(SCHEMA, undefined, {
  ContentForm,
  transformInitialValue: (vmTemplate, schema) => {
    const template = vmTemplate?.TEMPLATE ?? {}
    const context = template?.CONTEXT ?? {}
    const bootOrder = template?.OS?.BOOT
    const nics = [].concat(template?.NIC ?? []).flat()
    const knownTemplate = schema.cast(
      { ...vmTemplate, ...template },
      { stripUnknown: true, context: { ...template } }
    )

    // Get the custom vars from the context
    const knownContext = reach(schema, 'CONTEXT').cast(context, {
      stripUnknown: true,
      context: { ...template },
    })

    // Merge known and unknown context custom vars
    knownTemplate.CONTEXT = {
      ...knownContext,
      ...getUnknownAttributes(context, knownContext),
    }

    // Decode script base 64
    if (template?.CONTEXT?.START_SCRIPT_BASE64) {
      knownTemplate.CONTEXT = {
        ...knownTemplate?.CONTEXT,
        START_SCRIPT: decodeBase64(template?.CONTEXT?.START_SCRIPT_BASE64),
        ENCODE_START_SCRIPT: true,
      }
    }

    // Easy compatibility with the bootOrder component by specifying the same form paths as in the VM Template
    !!bootOrder && set(knownTemplate, 'extra.OS.BOOT', bootOrder)
    !!template?.DISK &&
      set(
        knownTemplate,
        'extra.DISK',
        []
          .concat(template?.DISK ?? [])
          ?.flat()
          ?.map((disk) => ({
            ...disk,
            NAME: `DISK${disk?.DISK_ID}`,
          }))
      )
    !!nics?.length && set(knownTemplate, 'extra.NIC', nics)

    return knownTemplate
  },
  transformBeforeSubmit: (formData, initialValues) => {
    const { extra, ...restFormData } = formData
    // Encode script on base 64, if needed, on context section
    const updatedFormData = {
      ...restFormData,
      OS: {
        ...restFormData.OS,
        BOOT: extra?.OS?.BOOT || restFormData.OS?.BOOT,
      },
    }
    if (isBase64(updatedFormData?.CONTEXT?.START_SCRIPT)) {
      updatedFormData.CONTEXT.START_SCRIPT_BASE64 =
        updatedFormData?.CONTEXT?.START_SCRIPT
      delete updatedFormData?.CONTEXT?.START_SCRIPT
    } else {
      delete updatedFormData?.CONTEXT?.START_SCRIPT_BASE64
    }

    // If initial CONTEXT is empty, no context data should be sent (it will cause a core error). The Configuration tab is disabled in that case, but we need to ensure that when update another tab, no context data is sent.
    if (!initialValues?.TEMPLATE?.CONTEXT) {
      delete updatedFormData?.CONTEXT
    }

    return updatedFormData
  },
})

export default UpdateConfigurationForm
