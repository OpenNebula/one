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
import { T } from '@ConstantsModule'
import { FormWithSchema } from '@ComponentsV2Module'
import { useSystemData } from '@FeaturesModule'
import { SECTIONS } from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/backup/schema'
import {
  BACKUP_VOLATILE_FIELD,
  DISK_SELECTION_FIELDS,
} from '@modules/resources/resources/VirtualMachine/Forms/BackupConfigForm/schema'
import { Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'

const getRowSections = (oneConfig, adminGroup) =>
  SECTIONS(oneConfig, adminGroup).map(({ fields = [], ...section }) => ({
    ...section,
    fields: fields.map((field) => ({
      ...field,
      grid: { ...field.grid, xs: 12, md: 12 },
    })),
  }))

/**
 * @param {object} props - Component properties
 * @param {object} props.oneConfig - OpenNEbula configuration
 * @param {boolean} props.adminGroup - If the user is admin
 * @param {object} props.vm - Virtual machine resource
 * @returns {ReactElement} Form content component
 */
const Content = ({ oneConfig, adminGroup, vm }) => {
  const systemData = useSystemData()
  const resolvedOneConfig = oneConfig ?? systemData?.oneConfig
  const resolvedAdminGroup = adminGroup ?? systemData?.adminGroup
  const sections = getRowSections(resolvedOneConfig, resolvedAdminGroup)
  const volatileField = sections
    .flatMap(({ fields = [] }) => fields)
    .find(({ name }) => name === BACKUP_VOLATILE_FIELD)
  const backupSections = sections.map(({ fields = [], ...section }) => ({
    ...section,
    fields: fields.filter(({ name }) => name !== BACKUP_VOLATILE_FIELD),
  }))
  const [includeAllDisksField, diskTableField] = DISK_SELECTION_FIELDS(vm)
  const diskSelectionFields = [
    includeAllDisksField,
    volatileField && {
      ...volatileField,
      label: T.IncludeVolatileVmDisks,
      tooltip: T.IncludeVolatileVmDisksHint,
      grid: { xs: 12, md: 6 },
    },
    diskTableField,
  ].filter(Boolean)

  return (
    <Stack display="grid" gap="1em" sx={{ gridTemplateColumns: '1fr' }}>
      {backupSections.map(({ id, ...section }) => (
        <FormWithSchema
          key={id}
          cy="backup-configuration"
          legend={T.Backup}
          {...section}
        />
      ))}
      <FormWithSchema
        cy="backup-disk-selection"
        legend={T.BackupDisks}
        fields={diskSelectionFields}
      />
    </Stack>
  )
}

Content.propTypes = {
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  vm: PropTypes.object,
}

export default Content
