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
import MultipleTags from '@modules/components/MultipleTags'
import { StatusCircle } from '@modules/components/Status'
import backupColumns from '@modules/components/Tables/Backups/columns'
import BackupRow from '@modules/components/Tables/Backups/row'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { useAuth, useViews, ImageAPI } from '@FeaturesModule'
import {
  getColorFromString,
  getUniqueLabels,
  getImageState,
  getImageType,
} from '@ModelsModule'
import { ReactElement, useMemo } from 'react'

const DEFAULT_DATA_CY = 'backups'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Backups table
 */
const BackupsTable = (props) => {
  const {
    rootProps = {},
    searchProps = {},
    vm,
    refetchVm,
    filter,
    isFetchingVm,
    ...rest
  } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const {
    data = [],
    isFetching,
    refetch,
  } = ImageAPI.useGetBackupsQuery(undefined, {
    selectFromResult: (result) => {
      const backupsIds = vm?.BACKUPS?.BACKUP_IDS?.ID
        ? Array.isArray(vm?.BACKUPS?.BACKUP_IDS?.ID)
          ? vm?.BACKUPS?.BACKUP_IDS?.ID
          : [vm?.BACKUPS?.BACKUP_IDS?.ID]
        : []

      const backupData = result?.data?.filter((backup) =>
        vm ? backupsIds?.includes(backup.ID) : true
      )

      return {
        ...result,
        data: typeof filter === 'function' ? filter(backupData) : backupData,
      }
    },
  })

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.BACKUP)?.filters,
        columns: backupColumns,
      }),
    [view]
  )

  /**
   * Refetch vms and backups. If a new backup is created, the id of the backup will be in the data of a vm, so we need to refetch also the vms query when we are showing the backups of a vm.
   */
  const refetchAll = () => {
    // Refetch vm only if the function exists (if not, we are looking for all backups, no matter which vm is associated)
    refetchVm && refetchVm()
    refetch()
  }

  const isFetchingAll = () =>
    isFetchingVm ? !!(isFetchingVm && isFetching) : isFetching

  const listHeader = [
    {
      header: '',
      id: 'status-icon',
      accessor: (template) => {
        const { color: stateColor, name: stateName } = getImageState(template)

        return <StatusCircle color={stateColor} tooltip={stateName} />
      },
    },
    { header: T.ID, id: 'id', accessor: 'ID' },
    { header: T.Name, id: 'name', accessor: 'NAME' },
    { header: T.Owner, id: 'owner', accessor: 'UNAME' },
    { header: T.Group, id: 'group', accessor: 'GNAME' },
    { header: T.Datastore, id: 'datastore', accessor: 'DATASTORE' },
    {
      header: T.Type,
      id: 'type',
      accessor: (template) => getImageType(template),
    },
    {
      header: T.Labels,
      id: 'labels',
      accessor: (_, { label: LABELS = [] }) => {
        const { labels: userLabels } = useAuth()
        const labels = useMemo(
          () =>
            getUniqueLabels(LABELS).reduce((acc, label) => {
              if (userLabels?.includes(label)) {
                acc.push({
                  text: label,
                  dataCy: `label-${label}`,
                  stateColor: getColorFromString(label),
                })
              }

              return acc
            }, []),
          [LABELS]
        )

        return <MultipleTags tags={labels} truncateText={10} />
      },
    },
  ]

  const { component, header } = WrapperRow(BackupRow)

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetchAll}
      isLoading={isFetchingAll()}
      getRowId={(row) => String(row.ID)}
      RowComponent={component}
      headerList={header && listHeader}
      {...rest}
    />
  )
}

BackupsTable.displayName = 'BackupsTable'

export default BackupsTable
