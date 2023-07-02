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
import { reach } from 'yup'

import { SCHEMA } from 'client/components/Forms/Vm/UpdateConfigurationForm/schema'
import ContentForm from 'client/components/Forms/Vm/UpdateConfigurationForm/content'
import { ensureContextWithScript } from 'client/components/Forms/VmTemplate/CreateForm/Steps'
import { createForm, getUnknownAttributes } from 'client/utils'

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

    // Merge known and unknown context custom vars
    knownTemplate.BACKUP_CONFIG = {
      ...knownBackupConfig,
      ...getUnknownAttributes(backupConfig, knownBackupConfig),
    }

    return knownTemplate
  },
  transformBeforeSubmit: (formData) => ensureContextWithScript(formData),
})

export default UpdateConfigurationForm
