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
import PropTypes from 'prop-types'
import { useCallback, useMemo } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'

import { StatusTag, Table, Tag } from '@ComponentsV2Module'
import { ImageAPI } from '@FeaturesModule'
import { getImageState } from '@ModelsModule'
import { SCHEMA } from '@modules/resources/resources/Backups/Forms/RestoreForm/Steps/BackupsTable/schema'

import { Step } from '@UtilsModule'
import { T } from '@ConstantsModule'

export const STEP_ID = 'image'

const getBackupType = (backup) =>
  backup?.BACKUP_INCREMENTS?.INCREMENT ? T.Incremental : T.Full

const BACKUP_COLUMNS = [
  {
    header: T.ID,
    id: 'id',
    accessorKey: 'ID',
    grow: false,
  },
  {
    header: T.Name,
    id: 'name',
    accessorKey: 'NAME',
    truncate: true,
  },
  {
    header: T.State,
    id: 'state',
    accessorFn: (row) => getImageState(row)?.name,
    cell: ({ row }) => {
      const { color, name } = getImageState(row.original) ?? {}

      return <StatusTag statusColor={color} statusName={name} />
    },
  },
  {
    header: T.Type,
    id: 'type',
    accessorFn: getBackupType,
    grow: false,
    cell: ({ row }) => (
      <Tag title={getBackupType(row.original)} status="default" />
    ),
  },
  {
    header: T.Datastore,
    id: 'datastore',
    accessorKey: 'DATASTORE',
    truncate: true,
  },
  {
    header: T.Owner,
    id: 'owner',
    accessorKey: 'UNAME',
    grow: false,
  },
  {
    header: T.Group,
    id: 'group',
    accessorKey: 'GNAME',
    grow: false,
  },
]

const Content = ({ data, app: { backupIds = [] } = {} }) => {
  const { clearErrors, control, setValue } = useFormContext()
  const watchedData = useWatch({ control, name: STEP_ID }) ?? data

  const backupIdsSet = useMemo(
    () =>
      new Set(
        []
          .concat(backupIds ?? [])
          .filter(Boolean)
          .map(String)
      ),
    [backupIds]
  )

  const {
    data: backups = [],
    isFetching,
    refetch,
  } = ImageAPI.useGetBackupsQuery(undefined, {
    selectFromResult: (result) => ({
      ...result,
      data:
        result?.data?.filter(({ ID }) => backupIdsSet.has(String(ID))) ?? [],
    }),
  })

  const selectedBackup = [].concat(watchedData ?? []).filter(Boolean)?.[0]
  const selectedBackupId =
    typeof selectedBackup === 'object' ? selectedBackup?.ID : selectedBackup
  const rowSelection =
    selectedBackupId !== undefined ? { [String(selectedBackupId)]: true } : {}

  const setSelectedBackup = useCallback(
    (backup) => {
      setValue(STEP_ID, backup?.ID !== undefined ? [backup] : [], {
        shouldDirty: true,
        shouldValidate: true,
      })
      clearErrors(STEP_ID)
    },
    [clearErrors, setValue]
  )

  const handleRowSelectionChange = useCallback(
    (updater) => {
      const nextSelection =
        typeof updater === 'function' ? updater(rowSelection) : updater
      const selectedIds = Object.keys(nextSelection ?? {})
      const selectedId = selectedIds[selectedIds.length - 1]
      const backup = backups.find(({ ID }) => String(ID) === String(selectedId))

      setSelectedBackup(backup)
    },
    [backups, rowSelection, setSelectedBackup]
  )

  return (
    <Table
      columns={BACKUP_COLUMNS}
      data={backups}
      defaultPageSize={5}
      getRowId={(row) => String(row.ID)}
      isEnableFilters={true}
      isEnableSearchBar={true}
      isEnableSort={true}
      isLoading={isFetching}
      isMultiRowSelection={false}
      isRowsSelectable={true}
      isRefreshing={isFetching}
      onRefresh={refetch}
      onRowClick={setSelectedBackup}
      onRowSelectionChange={handleRowSelectionChange}
      rowSelection={rowSelection}
    />
  )
}

/**
 * Step to select the Image.
 *
 * @param {object} app - Marketplace App resource
 * @returns {Step} Image step
 */
const ImageStep = (app) => {
  const { disableImageSelection } = app

  return {
    id: STEP_ID,
    label: T.SelectBackupImage,
    resolver: SCHEMA,
    content: (props) => Content({ ...props, app }),
    defaultDisabled: {
      condition: () => disableImageSelection,
    },
  }
}

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  app: PropTypes.object,
}

export default ImageStep
