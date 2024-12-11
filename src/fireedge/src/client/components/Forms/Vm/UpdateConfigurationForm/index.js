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

import { set } from 'lodash'
import { SCHEMA } from 'client/components/Forms/Vm/UpdateConfigurationForm/schema'
import ContentForm from 'client/components/Forms/Vm/UpdateConfigurationForm/content'
import {
  createForm,
  getUnknownAttributes,
  isBase64,
  decodeBase64,
} from 'client/utils'

const UpdateConfigurationForm = createForm(SCHEMA, undefined, {
  ContentForm,
  transformInitialValue: (vmTemplate, schema) => {
    const template = vmTemplate?.TEMPLATE ?? {}
    const context = template?.CONTEXT ?? {}
    const backupConfig = vmTemplate?.BACKUPS?.BACKUP_CONFIG ?? {}
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

    // Get the custom vars from the context
    const knownBackupConfig = reach(schema, 'BACKUP_CONFIG').cast(
      backupConfig,
      {
        stripUnknown: true,
        context: { ...template },
      }
    )

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

    // Merge known and unknown context custom vars
    knownTemplate.BACKUP_CONFIG = {
      ...knownBackupConfig,
      ...getUnknownAttributes(backupConfig, knownBackupConfig),
    }

    // Easy compatibility with the bootOrder component by specifying the same form paths as in the VM Template
    !!bootOrder && set(knownTemplate, 'extra.OS.BOOT', bootOrder)
    !!template?.DISK &&
      set(
        knownTemplate,
        'extra.DISK',
        template?.DISK?.map((disk) => ({
          ...disk,
          NAME: `DISK${disk?.DISK_ID}`,
        }))
      )
    !!nics?.length && set(knownTemplate, 'extra.NIC', nics)

    return knownTemplate
  },
  transformBeforeSubmit: (formData) => {
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

    return updatedFormData
  },
})

export default UpdateConfigurationForm
