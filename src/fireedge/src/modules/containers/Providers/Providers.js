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
  useViews,
} from '@FeaturesModule'
import { providerTable } from '@ModelsModule'
import { Provider } from '@ResourcesModule'
import { getActionsAvailable, timeFromMilliseconds } from '@UtilsModule'
import { ReactElement, useCallback, useMemo } from 'react'

import { DetailsDrawer } from '@modules/containers/Providers/Details'

/**
 * Displays a list of Providers with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} Providers list and selected row(s)
 */
export function Providers() {
  const {
    searchExpression,
    sortExpression,
    filterExpression,
    selectedItems = [],
    containerView,
  } = useFunctionality()
  const { setSelectedItems } = useFunctionalityApi()
  const { getResourceView } = useViews()
  const resourceView = getResourceView(RESOURCE_NAMES.PROVIDER)

  const availableActions = useMemo(
    () => getActionsAvailable(resourceView?.actions),
    [resourceView?.actions]
  )

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refresh,
  } = providerTable.useData()

  const filterOptions = useMemo(
    () => providerTable.filterOptions(data, resourceView?.filters),
    [data, resourceView?.filters]
  )

  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()
    const filteredData = search
      ? data?.filter((provider) => {
          const { ID, NAME, UNAME, GNAME, TEMPLATE = {} } = provider
          const {
            PROVIDER_BODY: {
              registration_time: registrationTime,
              provision_ids: provisionIds = [],
            } = {},
          } = TEMPLATE

          return [
            ID,
            NAME,
            UNAME,
            GNAME,
            provisionIds?.length ?? 0,
            registrationTime &&
              timeFromMilliseconds(+registrationTime).toRelative(),
          ]
            .filter((value) => value || value === 0)
            .some((value) => String(value).toLowerCase().includes(search))
        })
      : data

    const filteredByFilters = providerTable.filterData(
      filteredData,
      filterExpression,
      filterOptions
    )

    return providerTable.sortData(filteredByFilters, sortExpression)
  }, [data, searchExpression, sortExpression, filterExpression, filterOptions])

  const selectedProviders = useMemo(
    () => items?.filter(({ ID }) => selectedItems?.includes(String(ID))) ?? [],
    [items, selectedItems]
  )

  const rowSelection = useMemo(
    () => Object.fromEntries(selectedItems.map((id) => [String(id), true])),
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
    setSelectedItems(selectedItems.filter((selectedId) => selectedId !== id))
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
      resourceName={T.Providers}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      sortOptions={providerTable.sortOptions()}
      filterOptions={filterOptions}
      count={items?.length}
      selectedCount={selectedItems?.length}
      onSelectAll={(checked) =>
        setSelectedItems(
          checked ? items?.map(({ ID }) => String(ID)) ?? [] : []
        )
      }
    >
      {(() => {
        switch (containerView) {
          case TABLE_VIEW_MODE.LIST:
            return (
              <Table
                columns={providerTable.columns()}
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
                {items?.map((provider) => {
                  const id = String(provider?.ID)

                  return (
                    <Provider.Card
                      key={id}
                      provider={provider}
                      isSelected={selectedItems?.includes(id)}
                      onCheck={() =>
                        setSelectedItems(
                          selectedItems?.includes(id)
                            ? selectedItems.filter(
                                (selectedId) => selectedId !== id
                              )
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
        selectedProviders={selectedProviders}
        handleClose={handleClose}
        handleSelect={handleSelect}
        handleDeselect={handleDeselect}
        actions={availableActions}
      />
    </ResourceContainer>
  )
}
