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
import { RESOURCE_NAMES, T, TABLE_VIEW_MODE } from '@ConstantsModule'
import {
  useFunctionality,
  useFunctionalityApi,
  useGeneral,
  useViews,
} from '@FeaturesModule'
import { getAllocatedInfo, getHostState, hostTable } from '@ModelsModule'
import { Host } from '@ResourcesModule'
import { getTotalOfResources } from '@UtilsModule'
import { ReactElement, useCallback, useMemo } from 'react'
import { DetailsDrawer } from '@modules/containers/Hosts/Details'

/**
 * Displays a list of Hosts.
 *
 * @returns {ReactElement} Hosts list
 */
export function Hosts() {
  // Get hooks
  const {
    searchExpression,
    sortExpression,
    filterExpression,
    selectedItems,
    containerView,
  } = useFunctionality()
  const { zone } = useGeneral()
  const { getResourceView } = useViews()
  const resourceViewFilters = getResourceView(RESOURCE_NAMES.HOST)?.filters
  const { setSelectedItems } = useFunctionalityApi()

  // Get hosts pool
  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refreshHosts,
  } = hostTable.useData({ zone })

  const filterOptions = useMemo(
    () => hostTable.filterOptions(data, resourceViewFilters),
    [data, resourceViewFilters]
  )

  // Filter hosts in the search bar
  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()
    const filteredData = search
      ? data?.filter((host) => {
          const {
            CLUSTER,
            HOST_SHARE,
            ID,
            IM_MAD,
            NAME,
            TEMPLATE,
            VM_MAD,
            VMS,
          } = host
          const state = getHostState(host)
          const allocatedInfo = getAllocatedInfo(host)

          return [
            ID,
            TEMPLATE?.NAME ?? NAME,
            state?.name,
            CLUSTER,
            IM_MAD,
            VM_MAD,
            HOST_SHARE?.RUNNING_VMS,
            getTotalOfResources(VMS),
            allocatedInfo?.percentCpuLabel,
            allocatedInfo?.percentMemLabel,
            TEMPLATE?.LABELS,
          ]
            .filter((value) => value || value === 0)
            .some((value) => String(value).toLowerCase().includes(search))
        })
      : data

    const filteredByFilters = hostTable.filterData(
      filteredData,
      filterExpression,
      filterOptions
    )

    return hostTable.sortData(filteredByFilters, sortExpression)
  }, [data, searchExpression, sortExpression, filterExpression, filterOptions])

  // Handle the selection of a row
  const selectedItemIds = useMemo(
    () => new Set((selectedItems ?? []).map(String)),
    [selectedItems]
  )

  const rowSelection = useMemo(
    () => Object.fromEntries([...selectedItemIds].map((id) => [id, true])),
    [selectedItemIds]
  )

  // Selected hosts
  const selectedHosts = useMemo(
    () => items?.filter(({ ID }) => selectedItemIds.has(String(ID))) ?? [],
    [items, selectedItemIds]
  )

  // Handle details of a row
  const handleSelect = (ID) => {
    const id = String(ID)
    setSelectedItems(
      selectedItems?.length === 1 && String(selectedItems?.[0]) === id
        ? []
        : [id]
    )
  }

  const handleDeselect = (ID) => {
    const id = String(ID)
    setSelectedItems(selectedItems?.filter((item) => String(item) !== id))
  }

  // Handle change the details of a row
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
      dataCy={hostTable.dataCy}
      resourceName={T.Hosts}
      onRefresh={refreshHosts}
      isRefreshing={isRefreshing}
      sortOptions={hostTable.sortOptions()}
      filterOptions={filterOptions}
      searchPlaceholder={T.SearchHosts}
      count={items?.length}
      selectedCount={selectedItems?.length}
      onSelectAll={(checked) =>
        setSelectedItems(checked ? items?.map(({ ID }) => String(ID)) : [])
      }
    >
      {(() => {
        switch (containerView) {
          case TABLE_VIEW_MODE.LIST:
            return (
              <Table
                dataCy={hostTable.dataCy}
                columns={hostTable.columns()}
                data={items}
                isRowsSelectable
                isMultiRowSelection
                isCopyColumn
                rowSelection={rowSelection}
                onRowSelectionChange={handleRowSelectionChange}
                getRowId={(row) => String(row.ID)}
                onRowClick={(row) => handleSelect(row.ID)}
                size="medium"
                defaultPageSize={25}
                isFullHeight
                isLoading={isRefreshing}
              />
            )
          case TABLE_VIEW_MODE.CARD:
          default:
            return (
              <List isRowIndicatorDisabled={true} isLoading={isRefreshing}>
                {items?.map((host) => (
                  <Host.Card
                    key={host?.ID}
                    dataCy={`${hostTable.dataCy}-${host?.ID}`}
                    host={host}
                    isSelected={selectedItemIds.has(String(host?.ID))}
                    onCheck={() =>
                      setSelectedItems(
                        selectedItemIds.has(String(host?.ID))
                          ? [...selectedItemIds].filter(
                              (id) => id !== String(host?.ID)
                            )
                          : [...selectedItemIds, String(host?.ID)]
                      )
                    }
                    onClick={() => handleSelect(host?.ID)}
                  />
                ))}
              </List>
            )
        }
      })()}
      <DetailsDrawer
        selectedHosts={selectedHosts}
        handleClose={() => setSelectedItems([])}
        handleSelect={handleSelect}
        handleDeselect={handleDeselect}
      />
    </ResourceContainer>
  )
}
