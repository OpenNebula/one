/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import ContentForm from '@modules/resources/resources/VirtualMachine/Forms/BackupConfigForm/content'
import {
  DISK_IDS_FIELD,
  INCLUDE_ALL_DISKS_FIELD,
  SCHEMA,
} from '@modules/resources/resources/VirtualMachine/Forms/BackupConfigForm/schema'
import { createForm, getUnknownAttributes, jsonToXml } from '@UtilsModule'
import { normalizeBackupDiskIds } from '@ModelsModule'
import { ReactElement } from 'react'

import PropTypes from 'prop-types'
import { get, omit, set } from 'lodash'
import { reach } from 'yup'

/**
 * @param {object} props - Component props
 * @param {object} props.oneConfig - OpenNEbula configuration
 * @param {boolean} props.adminGroup - If the user is admin
 * @returns {ReactElement} IO section component
 */
const BackupConfigForm = createForm(SCHEMA, undefined, {
  ContentForm,
  transformInitialValue: (vmTemplate, schema) => {
    const template = vmTemplate?.TEMPLATE ?? {}

    const backupConfig = vmTemplate?.BACKUPS?.BACKUP_CONFIG ?? {}
    const diskIds = normalizeBackupDiskIds(backupConfig?.DISK_IDS)

    const knownTemplate = schema.cast(
      { ...vmTemplate, ...template },
      { stripUnknown: true, context: { ...template } }
    )

    // Get the custom vars from the context
    const knownBackupConfig = reach(schema, 'BACKUP_CONFIG').cast(
      {
        ...backupConfig,
        DISK_IDS: diskIds,
        _INCLUDE_ALL_VM_DISKS: diskIds.length === 0,
      },
      {
        stripUnknown: true,
        context: { ...template },
      }
    )

    // Merge known and unknown context custom vars
    knownTemplate.BACKUP_CONFIG = {
      ...knownBackupConfig,
      ...getUnknownAttributes(backupConfig, knownBackupConfig),
    }

    return knownTemplate
  },
  transformBeforeSubmit: (formData) => {
    const includeAllDisks = get(formData, INCLUDE_ALL_DISKS_FIELD)
    const diskIds = get(formData, DISK_IDS_FIELD)
    const template = omit(formData, INCLUDE_ALL_DISKS_FIELD)

    if (includeAllDisks) {
      template.BACKUP_CONFIG = omit(template.BACKUP_CONFIG, 'DISK_IDS')
    } else {
      set(template, DISK_IDS_FIELD, diskIds)
    }

    return { template: jsonToXml(template) }
  },
})

BackupConfigForm.displayName = 'BackupConfigForm'

BackupConfigForm.propTypes = {
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

export default BackupConfigForm
