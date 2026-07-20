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
import { RESOURCE_NAMES, T, TABLE_VIEW_MODE, UNITS } from '@ConstantsModule'
import {
  useFunctionality,
  useFunctionalityApi,
  useViews,
} from '@FeaturesModule'
import { ReactElement, useCallback, useMemo } from 'react'
import {
  getActionsAvailable,
  prettyBytes,
  timeFromMilliseconds,
} from '@UtilsModule'
import { DetailsDrawer } from '@modules/containers/MarketplaceApps/Details'
import {
  getMarketplaceAppState,
  getMarketplaceAppType,
  marketplaceAppTable,
} from '@ModelsModule'
import { MarketplaceApp as MarketplaceAppsResource } from '@ResourcesModule'

const normalizeTableColumns = (columns = []) =>
  columns.map(({ accessorKey, ...column }) => {
    if (typeof accessorKey === 'function') {
      return {
        ...column,
        accessorFn: accessorKey,
      }
    }

    if (accessorKey && typeof accessorKey !== 'string') {
      return column
    }

    return {
      ...column,
      ...(accessorKey ? { accessorKey } : {}),
    }
  })

/**
 * Displays a list of Marketplace Apps with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} Marketplace Apps list and selected row(s)
 */
export function MarketplaceApps() {
  const {
    searchExpression,
    sortExpression,
    filterExpression,
    selectedItems,
    containerView,
  } = useFunctionality()
  const { getResourceView } = useViews()
  const resourceView = getResourceView(RESOURCE_NAMES.APP)

  const availableActions = useMemo(
    () => getActionsAvailable(resourceView?.actions),
    [resourceView?.actions]
  )

  const { setSelectedItems } = useFunctionalityApi()

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refresh,
  } = marketplaceAppTable.useData()

  const tableColumns = useMemo(
    () => normalizeTableColumns(marketplaceAppTable.columns()),
    []
  )

  const filterOptions = useMemo(
    () =>
      marketplaceAppTable.filterOptions(
        data,
        resourceView?.filters,
        undefined,
        [
          {
            id: 'type',
            header: T.Type,
            accessorFn: (marketplaceApp) =>
              getMarketplaceAppType(marketplaceApp),
          },
          {
            id: 'marketplace',
            header: T.Marketplace,
            accessorKey: 'MARKETPLACE',
          },
          {
            id: 'zone',
            header: T.Zone,
            accessorKey: 'ZONE_ID',
          },
        ]
      ),
    [data, resourceView?.filters]
  )

  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()
    const filteredData = search
      ? data?.filter((marketplaceApp) => {
          const {
            ID,
            NAME,
            UNAME,
            GNAME,
            MARKETPLACE,
            SIZE,
            REGTIME,
            VERSION,
            LOCK,
            TEMPLATE = {},
          } = marketplaceApp
          const state = getMarketplaceAppState(marketplaceApp)
          const hypervisor = [TEMPLATE?.HYPERVISOR ?? []]
            .flat()
            .filter(Boolean)
            .join(', ')
          const architecture = [TEMPLATE?.ARCHITECTURE ?? []]
            .flat()
            .filter(Boolean)
            .join(', ')

          return [
            ID,
            NAME,
            UNAME,
            GNAME,
            state?.name,
            prettyBytes(SIZE, UNITS.MB),
            MARKETPLACE,
            hypervisor,
            architecture,
            VERSION,
            LOCK && T.Locked,
            REGTIME && timeFromMilliseconds(+REGTIME).toRelative(),
          ]
            .filter((value) => value || value === 0)
            .some((value) => String(value).toLowerCase().includes(search))
        })
      : data

    const filteredByFilters = marketplaceAppTable.filterData(
      filteredData,
      filterExpression,
      filterOptions
    )

    return marketplaceAppTable.sortData(filteredByFilters, sortExpression)
  }, [data, searchExpression, sortExpression, filterExpression, filterOptions])

  const selectedMarketplaceApps = useMemo(
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
      resourceName={T.Apps}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      sortOptions={marketplaceAppTable.sortOptions()}
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
                columns={tableColumns}
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
                {items?.map((marketplaceApp) => {
                  const { ID } = marketplaceApp
                  const id = String(ID)

                  return (
                    <MarketplaceAppsResource.Card
                      key={id}
                      marketplaceApp={marketplaceApp}
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
        selectedMarketplaceApps={selectedMarketplaceApps}
        handleClose={handleClose}
        handleSelect={handleSelect}
        handleDeselect={handleDeselect}
        actions={availableActions}
      />
    </ResourceContainer>
  )
}
