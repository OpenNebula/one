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
import { T, TABLE_VIEW_MODE } from '@ConstantsModule'
import {
  useFunctionality,
  useFunctionalityApi,
  useViews,
} from '@FeaturesModule'
import { ReactElement, useCallback, useMemo } from 'react'
import {
  getActionsAvailable,
  timeFromMilliseconds,
  timeToString,
} from '@UtilsModule'
import {
  getServiceState,
  getServiceTotalRoles,
  getServiceTotalVms,
  serviceTable,
} from '@ModelsModule'
import { Service } from '@ResourcesModule'
import { DetailsDrawer } from '@modules/containers/Services/Details'

/**
 * Displays a list of Services with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} Service list and selected row(s)
 */
export function Services() {
  const {
    searchExpression,
    sortExpression,
    filterExpression,
    selectedItems = [],
    containerView,
  } = useFunctionality()
  const { getResourceView } = useViews()
  const { setSelectedItems } = useFunctionalityApi()

  const viewConfig = useMemo(
    () => getResourceView(Service.RID),
    [getResourceView]
  )

  const availableActions = useMemo(
    () => getActionsAvailable(viewConfig?.actions),
    [viewConfig]
  )

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refresh,
    error,
  } = serviceTable.useData()

  const filterOptions = useMemo(
    () => serviceTable.filterOptions(data, viewConfig?.filters),
    [data, viewConfig?.filters]
  )

  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()
    const filteredData = search
      ? data?.filter((service) => {
          const {
            ID,
            NAME,
            UNAME,
            GNAME,
            TEMPLATE: {
              BODY: {
                deployment,
                registration_time: regTime,
                start_time: startTime,
              },
            } = { BODY: {} },
          } = service
          const state = getServiceState(service)
          const registeredTime = regTime ?? startTime

          return [
            ID,
            NAME,
            UNAME,
            GNAME,
            state?.displayName,
            getServiceTotalRoles(service),
            getServiceTotalVms(service),
            deployment,
            registeredTime && timeToString(registeredTime),
            registeredTime &&
              timeFromMilliseconds(+registeredTime).toRelative(),
          ]
            .filter((value) => value || value === 0)
            .some((value) => String(value).toLowerCase().includes(search))
        })
      : data

    const filteredByFilters = serviceTable.filterData(
      filteredData,
      filterExpression,
      filterOptions
    )

    return serviceTable.sortData(filteredByFilters, sortExpression)
  }, [data, searchExpression, sortExpression, filterExpression, filterOptions])

  const selectedServices = useMemo(
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
      resourceName={T.Services}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      sortOptions={serviceTable.sortOptions()}
      filterOptions={filterOptions}
      count={items?.length}
      selectedCount={selectedItems?.length}
      unavailableMessage={
        error?.status === 500 ? T.CannotConnectOneFlow : undefined
      }
      onSelectAll={(checked) =>
        setSelectedItems(checked ? items?.map(({ ID }) => String(ID)) : [])
      }
    >
      {(() => {
        switch (containerView) {
          case TABLE_VIEW_MODE.LIST:
            return (
              <Table
                columns={serviceTable.columns()}
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
                {items?.map((service) => {
                  const { ID } = service
                  const id = String(ID)

                  return (
                    <Service.Card
                      key={id}
                      service={service}
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
        selectedServices={selectedServices}
        handleClose={handleClose}
        handleSelect={handleSelect}
        handleDeselect={handleDeselect}
        actions={availableActions}
        viewConfig={viewConfig}
      />
    </ResourceContainer>
  )
}
