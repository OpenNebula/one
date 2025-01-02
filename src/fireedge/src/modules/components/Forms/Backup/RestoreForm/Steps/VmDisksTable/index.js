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
import PropTypes from 'prop-types'
import { useFormContext } from 'react-hook-form'

import { VmDisksTable } from '@modules/components/Tables'
import { SCHEMA } from '@modules/components/Forms/Backup/RestoreForm/Steps/VmDisksTable/schema'

import { Step } from '@UtilsModule'
import { T } from '@ConstantsModule'
import { STEP_ID as IMAGE_STEP_ID } from '@modules/components/Forms/Backup/RestoreForm/Steps/BackupsTable'

export const STEP_ID = 'vmdisk'

const Content = ({ data, app: { backupDiskIds = [], vmsId = [] } = {} }) => {
  const { setValue, getValues } = useFormContext()
  const BACKUP_IMAGE = getValues(IMAGE_STEP_ID)?.[0]
  const BACKUP_IMAGE_DISK_IDS = BACKUP_IMAGE?.BACKUP_DISK_IDS?.ID

  const getValidArray = (arr) =>
    Array.isArray(arr) && arr?.length > 0 ? arr : false

  const formatBackupDiskIds =
    getValidArray(backupDiskIds) || getValidArray(BACKUP_IMAGE_DISK_IDS) || []
  const selectedRow = data?.[0]

  const handleSelectedRows = (rows) => {
    const { original = {} } = rows?.[0] ?? {}

    setValue(
      STEP_ID,
      original?.DISK_ID !== undefined ? [original?.DISK_ID] : []
    )
  }

  return (
    <VmDisksTable.Table
      singleSelect
      disableGlobalSort
      displaySelectedRows
      pageSize={5}
      onSelectedRowsChange={handleSelectedRows}
      vmId={vmsId?.[0]}
      initialState={{
        selectedRowIds: { [selectedRow]: true },
      }}
      filter={(disks) =>
        disks &&
        disks?.length > 0 &&
        disks?.filter((disk) => formatBackupDiskIds?.includes(disk?.DISK_ID))
      }
    />
  )
}

/**
 * Step to select the disk to restore.
 *
 * @param {object} app - Backupdisk ID's + VM id resource
 * @returns {Step} Individual disk step
 */
const IndividualDiskStep = (app) => ({
  id: STEP_ID,
  label: T.SelectDisk,
  resolver: SCHEMA,
  content: (props) => Content({ ...props, app }),
  defaultDisabled: {
    condition: () => true,
  },
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  app: PropTypes.object,
}

export default IndividualDiskStep
