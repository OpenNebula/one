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
import { VirtualMachine } from '@ResourcesModule'
import { T, TABLE_VIEW_MODE, VM_POOL_PAGINATION_SIZE } from '@ConstantsModule'
import {
  useFunctionalityApi,
  useFunctionality,
  useViews,
  VmAPI,
} from '@FeaturesModule'
import { ReactElement, useMemo, useCallback, useState } from 'react'
import { DetailsDrawer } from '@modules/containers/VirtualMachines/Details'
import {
  getHypervisor,
  getIps,
  getLastHistory,
  getVMLocked,
  getVirtualMachineState,
  getVirtualMachineType,
  vmsTable,
} from '@ModelsModule'
import { prettyBytes, timeFromMilliseconds } from '@UtilsModule'

/**
 * Displays a list of VM Templates with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} VM Templates list and selected row(s)
 */
export function VirtualMachines() {
  const {
    searchExpression,
    sortExpression,
    filterExpression,
    selectedItems,
    containerView,
  } = useFunctionality()
  const { getResourceView } = useViews()

  const viewConfig = useMemo(
    () => getResourceView(VirtualMachine.RID),
    [getResourceView]
  )

  const { setSelectedItems } = useFunctionalityApi()
  const [visibleVmIds, setVisibleVmIds] = useState([])

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refresh,
  } = vmsTable.useData({
    extended: 0,
    pageSize: VM_POOL_PAGINATION_SIZE,
  })

  const filterOptions = useMemo(
    () => vmsTable.filterOptions(data, viewConfig?.filters),
    [data, viewConfig?.filters]
  )

  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()
    const filteredData = search
      ? data?.filter((vm) => {
          const { ID, NAME, GNAME, UNAME, STIME, TEMPLATE = {} } = vm
          const { CPU = 1, MEMORY = 0, VCPU = 1 } = TEMPLATE
          const state = getVirtualMachineState(vm)

          return [
            ID,
            NAME,
            state?.name,
            `${CPU}/${VCPU || CPU}`,
            prettyBytes(MEMORY, 'MB'),
            UNAME,
            GNAME,
            STIME && timeFromMilliseconds(+STIME).toRelative(),
            getVMLocked(vm),
            getVMLocked(vm) && T.Locked,
            getVirtualMachineType(vm),
            getIps(vm).join(),
            getLastHistory(vm)?.HOSTNAME,
            getHypervisor(vm),
          ]
            .filter((value) => value || value === 0)
            .some((value) => String(value).toLowerCase().includes(search))
        })
      : data

    const filteredByFilters = vmsTable.filterData(
      filteredData,
      filterExpression,
      filterOptions
    )

    return vmsTable.sortData(filteredByFilters, sortExpression)
  }, [data, searchExpression, sortExpression, filterExpression, filterOptions])

  const selectedVms = useMemo(
    () => items?.filter(({ ID }) => selectedItems?.includes(ID)) ?? [],
    [items, selectedItems]
  )

  const visibleVmIdsKey = visibleVmIds.join(',')
  const { data: extendedVisibleVms = [] } = VmAPI.useGetVmInfosetQuery(
    { ids: visibleVmIdsKey, extended: 1 },
    { skip: !visibleVmIdsKey }
  )

  const visibleItems = useMemo(() => {
    const extendedVmsById = new Map(
      extendedVisibleVms.map((vm) => [String(vm.ID), vm])
    )

    return items.map((vm) => ({
      ...vm,
      ...(extendedVmsById.get(String(vm.ID)) ?? {}),
    }))
  }, [extendedVisibleVms, items])

  const handleVisibleVmIdsChange = useCallback((ids) => {
    const nextIds = [...new Set(ids.map(String))].sort()

    setVisibleVmIds((currentIds) =>
      currentIds.length === nextIds.length &&
      currentIds.every((id, index) => id === nextIds[index])
        ? currentIds
        : nextIds
    )
  }, [])

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
      resourceName={T.VirtualMachines}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      sortOptions={vmsTable.sortOptions()}
      filterOptions={filterOptions}
      searchPlaceholder={`${T.Search} ${T.VirtualMachines}`}
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
                columns={vmsTable.columns()}
                data={visibleItems}
                isLoading={isRefreshing}
                isRowsSelectable
                isMultiRowSelection
                isCopyColumn
                rowSelection={rowSelection}
                onRowSelectionChange={handleRowSelectionChange}
                getRowId={(row) => row.ID}
                onVisibleRowIdsChange={handleVisibleVmIdsChange}
                onRowClick={(row) => handleSelect(row.ID)}
                size="medium"
                defaultPageSize={25}
                isFullHeight
              />
            )
          case TABLE_VIEW_MODE.CARD:
          default:
            return (
              <List
                isRowIndicatorDisabled={true}
                isLoading={isRefreshing}
                getItemId={(item) => item?.props?.ID}
                onVisibleItemIdsChange={handleVisibleVmIdsChange}
              >
                {visibleItems?.map(
                  ({
                    NAME,
                    ID,
                    GNAME,
                    UNAME,
                    STIME,
                    LOCK = false,
                    STATE,
                    LCM_STATE,
                    LABELS,
                    ...vm
                  }) => (
                    <VirtualMachine.Card
                      key={ID}
                      NAME={NAME}
                      ID={ID}
                      GNAME={GNAME}
                      UNAME={UNAME}
                      STIME={STIME}
                      LOCK={LOCK}
                      STATE={STATE}
                      LCM_STATE={LCM_STATE}
                      LABELS={LABELS}
                      TEMPLATE={vm?.TEMPLATE}
                      USER_TEMPLATE={vm?.USER_TEMPLATE}
                      HISTORY_RECORDS={vm?.HISTORY_RECORDS}
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
        selectedVms={selectedVms}
        handleClose={handleClose}
        handleSelect={handleSelect}
        handleDeselect={handleDeselect}
        viewConfig={viewConfig}
      />
    </ResourceContainer>
  )
}
