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

    return knownTemplate
  },
  transformBeforeSubmit: (formData) => {
    // Encode script on base 64, if needed, on context section
    if (isBase64(formData?.CONTEXT?.START_SCRIPT)) {
      formData.CONTEXT.START_SCRIPT_BASE64 = formData?.CONTEXT?.START_SCRIPT
      delete formData?.CONTEXT?.START_SCRIPT
    } else {
      delete formData?.CONTEXT?.START_SCRIPT_BASE64
    }
  },
})

export default UpdateConfigurationForm
