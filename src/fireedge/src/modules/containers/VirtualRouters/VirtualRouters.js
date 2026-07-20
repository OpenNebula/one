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

import { List, ResourceContainer, Table } from '@ComponentsV2Module'
import { RESOURCE_NAMES, T, TABLE_VIEW_MODE } from '@ConstantsModule'
import {
  useFunctionality,
  useFunctionalityApi,
  useViews,
} from '@FeaturesModule'
import { ReactElement, useCallback, useMemo } from 'react'
import { getActionsAvailable } from '@UtilsModule'
import { DetailsDrawer } from '@modules/containers/VirtualRouters/Details'
import {
  getVirtualRouterTotalNics,
  getVirtualRouterTotalVms,
  vrTable,
} from '@ModelsModule'
import { VirtualRouter } from '@ResourcesModule'

/**
 * Displays a list of Virtual Routers with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} Virtual Routers list and selected row(s)
 */
export function VirtualRouters() {
  const {
    searchExpression,
    sortExpression,
    filterExpression,
    selectedItems,
    containerView,
  } = useFunctionality()
  const { getResourceView } = useViews()
  const resourceView = getResourceView(RESOURCE_NAMES.VROUTER)

  const availableActions = useMemo(
    () => getActionsAvailable(resourceView?.actions),
    [resourceView?.actions]
  )

  const { setSelectedItems } = useFunctionalityApi()

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refresh,
  } = vrTable.useData()

  const filterOptions = useMemo(
    () => vrTable.filterOptions(data, resourceView?.filters),
    [data, resourceView?.filters]
  )

  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()
    const filteredData = search
      ? data?.filter((vrouter) => {
          const { GNAME, ID, LOCK, NAME, TEMPLATE_ID, UNAME } = vrouter

          return [
            ID,
            NAME,
            UNAME,
            GNAME,
            TEMPLATE_ID,
            getVirtualRouterTotalVms(vrouter),
            getVirtualRouterTotalNics(vrouter),
            LOCK && T.Locked,
          ]
            .filter((value) => value || value === 0)
            .some((value) => String(value).toLowerCase().includes(search))
        })
      : data

    const filteredByFilters = vrTable.filterData(
      filteredData,
      filterExpression,
      filterOptions
    )

    return vrTable.sortData(filteredByFilters, sortExpression)
  }, [data, searchExpression, sortExpression, filterExpression, filterOptions])

  const selectedResources = useMemo(
    () => items?.filter(({ ID }) => selectedItems?.includes(String(ID))) ?? [],
    [items, selectedItems]
  )

  const rowSelection = useMemo(
    () =>
      Object.fromEntries((selectedItems ?? []).map((id) => [String(id), true])),
    [selectedItems]
  )

  const handleClose = () => setSelectedItems([])

  const handleSelect = (ID) => {
    const id = String(ID)

    setSelectedItems(
      selectedItems?.length === 1 && selectedItems?.[0] === id ? [] : [id]
    )
  }

  const handleDeselect = (ID) => {
    const id = String(ID)

    setSelectedItems(selectedItems.filter((itemId) => itemId !== id))
  }

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
      resourceName={T.VirtualRouters}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      sortOptions={vrTable.sortOptions()}
      filterOptions={filterOptions}
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
                columns={vrTable.columns()}
                data={items}
                isLoading={isRefreshing}
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
              />
            )
          case TABLE_VIEW_MODE.CARD:
          default:
            return (
              <List isRowIndicatorDisabled={true} isLoading={isRefreshing}>
                {items?.map((vrouter) => {
                  const { ID } = vrouter
                  const id = String(ID)

                  return (
                    <VirtualRouter.Card
                      key={id}
                      vrouter={vrouter}
                      isSelected={selectedItems?.includes(id)}
                      onCheck={() =>
                        setSelectedItems(
                          selectedItems?.includes(id)
                            ? selectedItems.filter((itemId) => itemId !== id)
                            : [...(selectedItems ?? []), id]
                        )
                      }
                      onClick={() => handleSelect(id)}
                    />
                  )
                })}
              </List>
            )
        }
      })()}

      <DetailsDrawer
        selectedResources={selectedResources}
        handleClose={handleClose}
        handleSelect={handleSelect}
        handleDeselect={handleDeselect}
        actions={availableActions}
      />
    </ResourceContainer>
  )
}
