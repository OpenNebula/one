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
/* eslint-disable react/prop-types */
import { List, ResourceContainer, Table } from '@ComponentsV2Module'
import { DetailsDrawer } from '@modules/containers/BackupJobs/Details'
import { RESOURCE_NAMES, TABLE_VIEW_MODE, T } from '@ConstantsModule'
import {
  BackupJobAPI,
  useFunctionality,
  useFunctionalityApi,
  useGeneral,
  useViews,
} from '@FeaturesModule'
import {
  backupJobTable,
  getBackupJobLastBackupTime,
  getBackupJobRelativeLastBackupTime,
  getBackupJobStatus,
} from '@ModelsModule'
import { ReactElement, useCallback, useMemo } from 'react'
import { BackupJobs as BackupJobsResource } from '@ResourcesModule'

/**
 * Displays a list of Backup Jobs with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} Backup Jobs list and selected row(s)
 */
export function BackupJobs() {
  const { zone } = useGeneral()
  const { searchExpression, sortExpression, selectedItems, containerView } =
    useFunctionality()

  const { getResourceView } = useViews()
  const availableActions = useMemo(
    () => getResourceView(RESOURCE_NAMES.BACKUPJOBS)?.actions ?? {},
    [getResourceView]
  )

  const { setSelectedItems } = useFunctionalityApi()

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refresh,
  } = BackupJobAPI.useGetBackupJobsQuery({ zone })

  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()
    const filteredData = search
      ? data?.filter((backupJob) => {
          const { ID, NAME, UNAME, GNAME, PRIORITY, LAST_BACKUP_TIME } =
            backupJob
          const state = getBackupJobStatus(backupJob)

          return [
            ID,
            NAME,
            state?.name,
            PRIORITY,
            getBackupJobLastBackupTime(LAST_BACKUP_TIME),
            getBackupJobRelativeLastBackupTime(LAST_BACKUP_TIME),
            UNAME,
            GNAME,
          ]
            .filter((value) => value || value === 0)
            .some((value) => String(value).toLowerCase().includes(search))
        })
      : data

    return backupJobTable.sortData(filteredData, sortExpression)
  }, [data, searchExpression, sortExpression])

  const selectedData = useMemo(
    () => items?.filter(({ ID }) => selectedItems?.includes(ID)) ?? [],
    [items, selectedItems]
  )

  const rowSelection = useMemo(
    () => Object.fromEntries(selectedItems.map((id) => [id, true])),
    [selectedItems]
  )
  const handleClose = () => setSelectedItems([])
  const handleSelect = (ID) =>
    setSelectedItems(
      selectedItems?.length === 1 && selectedItems?.[0] === ID ? [] : [ID]
    )
  const handleDeselect = (ID) =>
    setSelectedItems(selectedItems.filter((id) => id !== ID))

  const handleRowSelectionChange = useCallback(
    (updater) => {
      const next =
        typeof updater === 'function' ? updater(rowSelection) : updater
      setSelectedItems(Object.keys(next).filter((id) => next[id]))
    },
    [rowSelection, setSelectedItems]
  )

  return (
    <ResourceContainer
      resourceName={T.BackupJobs}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      sortOptions={backupJobTable.sortOptions()}
      count={items?.length}
      selectedCount={selectedItems?.length}
      onSelectAll={(checked) =>
        setSelectedItems(checked ? items?.map(({ ID }) => ID) : [])
      }
    >
      {(() => {
        switch (containerView) {
          case TABLE_VIEW_MODE.LIST:
            return (
              <Table
                columns={backupJobTable.columns()}
                data={items}
                isLoading={isRefreshing}
                isRowsSelectable
                isMultiRowSelection
                isCopyColumn
                rowSelection={rowSelection}
                onRowSelectionChange={handleRowSelectionChange}
                getRowId={(row) => row.ID}
                onRowClick={(row) => handleSelect(row.ID)}
                size="medium"
                defaultPageSize={25}
                isFullHeight
              />
            )
          case TABLE_VIEW_MODE.CARD:
          default:
            return (
              <List isRowIndicatorDisabled={true} isLoading={isRefreshing}>
                {items?.map((backupjob) => (
                  <BackupJobsResource.Card
                    key={backupjob?.ID}
                    data={backupjob}
                    isSelected={selectedItems?.includes(backupjob?.ID)}
                    onCheck={() =>
                      setSelectedItems(
                        selectedItems?.includes(backupjob?.ID)
                          ? selectedItems.filter((id) => id !== backupjob?.ID)
                          : [...(selectedItems ?? []), backupjob?.ID]
                      )
                    }
                    onClick={() => handleSelect(backupjob?.ID)}
                  />
                ))}
              </List>
            )
        }
      })()}
      <DetailsDrawer
        selectedData={selectedData}
        handleClose={handleClose}
        handleSelect={handleSelect}
        handleDeselect={handleDeselect}
        availableActions={availableActions}
      />
    </ResourceContainer>
  )
}
