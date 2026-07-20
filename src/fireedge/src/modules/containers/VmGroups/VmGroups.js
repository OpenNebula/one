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

import { List, Table, ResourceContainer } from '@ComponentsV2Module'
import { T, TABLE_VIEW_MODE, RESOURCE_NAMES } from '@ConstantsModule'
import {
  useFunctionalityApi,
  useFunctionality,
  useViews,
} from '@FeaturesModule'
import { ReactElement, useMemo, useCallback } from 'react'
import { getActionsAvailable } from '@UtilsModule'
import { DetailsDrawer } from '@modules/containers/VmGroups/Details'
import { getVmGroupState, vmgroupTable } from '@ModelsModule'
import { VmGroup } from '@ResourcesModule'

/**
 * Displays a list of VM Groups with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} VM Groups list and selected row(s)
 */
export function VmGroups() {
  const {
    searchExpression,
    sortExpression,
    filterExpression,
    selectedItems,
    containerView,
  } = useFunctionality()
  const { getResourceView } = useViews()
  const resourceView = getResourceView(RESOURCE_NAMES.VM_GROUP)

  const availableActions = useMemo(
    () => getActionsAvailable(resourceView),
    [resourceView]
  )

  const { setSelectedItems } = useFunctionalityApi()

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refresh,
  } = vmgroupTable.useData()

  const filterOptions = useMemo(
    () =>
      vmgroupTable.filterOptions(data, resourceView?.filters, undefined, [
        {
          id: 'state',
          header: T.State,
          accessorFn: (vmgroup) => getVmGroupState(vmgroup?.LOCK)?.name,
        },
      ]),
    [data, resourceView?.filters]
  )

  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()
    const filteredData = search
      ? data?.filter(({ ID, NAME, UNAME, GNAME } = {}) =>
          [ID, NAME, UNAME, GNAME]
            .filter((value) => value || value === 0)
            .some((value) => String(value).toLowerCase().includes(search))
        )
      : data

    const filteredByFilters = vmgroupTable.filterData(
      filteredData,
      filterExpression,
      filterOptions
    )

    return vmgroupTable.sortData(filteredByFilters, sortExpression)
  }, [data, searchExpression, sortExpression, filterExpression, filterOptions])

  const selectedVmGroups = useMemo(
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
      resourceName={T.VMGroups}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      sortOptions={vmgroupTable.sortOptions()}
      filterOptions={filterOptions}
      searchPlaceholder={`${T.Search} ${T.VMGroups}`}
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
                columns={vmgroupTable.columns()}
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
                {items?.map(
                  ({ NAME, ID, GNAME, UNAME, LOCK = false, LABELS }) => (
                    <VmGroup.Card
                      key={ID}
                      NAME={NAME}
                      ID={ID}
                      GNAME={GNAME}
                      UNAME={UNAME}
                      LOCK={LOCK}
                      LABELS={LABELS}
                      isSelected={selectedItems?.includes(ID)}
                      onCheck={() =>
                        setSelectedItems(
                          selectedItems?.includes(ID)
                            ? selectedItems.filter((id) => id !== ID)
                            : [...(selectedItems ?? []), ID]
                        )
                      }
                      onClick={() => handleSelect(ID)}
                    />
                  )
                )}
              </List>
            )
        }
      })()}
      <DetailsDrawer
        selectedVmGroups={selectedVmGroups}
        handleClose={handleClose}
        handleSelect={handleSelect}
        handleDeselect={handleDeselect}
        actions={availableActions}
      />
    </ResourceContainer>
  )
}
