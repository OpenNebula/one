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
import { getActionsAvailable, timeFromMilliseconds } from '@UtilsModule'
import { DetailsDrawer } from '@modules/containers/ServiceTemplates/Details'
import { servicetemplateTable } from '@ModelsModule'
import { ServiceTemplate } from '@ResourcesModule'

/**
 * Displays a list of VM Templates with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} VM Templates list and selected row(s)
 */
export function ServiceTemplates() {
  const {
    searchExpression,
    sortExpression,
    filterExpression,
    selectedItems,
    containerView,
  } = useFunctionality()
  const { getResourceView } = useViews()
  const resourceView = getResourceView(RESOURCE_NAMES.SERVICE_TEMPLATE)

  const availableActions = useMemo(
    () =>
      getActionsAvailable(getResourceView(RESOURCE_NAMES.VM_TEMPLATE)?.actions),
    [getResourceView]
  )

  const { setSelectedItems } = useFunctionalityApi()

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refresh,
    error,
  } = servicetemplateTable.useData()

  const filterOptions = useMemo(
    () => servicetemplateTable.filterOptions(data, resourceView?.filters),
    [data, resourceView?.filters]
  )

  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()
    const filteredData = search
      ? data?.filter((template) => {
          const {
            ID,
            NAME,
            GNAME,
            UNAME,
            TEMPLATE: { BODY: { registration_time: REGTIME = 0 } = {} } = {},
          } = template

          return [
            ID,
            NAME,
            REGTIME && timeFromMilliseconds(+REGTIME).toRelative(),
            UNAME,
            GNAME,
          ]
            .filter((value) => value || value === 0)
            .some((value) => String(value).toLowerCase().includes(search))
        })
      : data

    const filteredByFilters = servicetemplateTable.filterData(
      filteredData,
      filterExpression,
      filterOptions
    )

    return servicetemplateTable.sortData(filteredByFilters, sortExpression)
  }, [data, searchExpression, sortExpression, filterExpression, filterOptions])

  const selectedTemplates = useMemo(
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
      resourceName={T.Templates}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      sortOptions={servicetemplateTable.sortOptions()}
      filterOptions={filterOptions}
      searchPlaceholder={T.SearchTemplates}
      count={items?.length}
      selectedCount={selectedItems?.length}
      unavailableMessage={
        error?.status === 500 ? T.CannotConnectOneFlow : undefined
      }
      onSelectAll={(checked) =>
        setSelectedItems(checked ? items?.map(({ ID }) => ID) : [])
      }
    >
      {(() => {
        switch (containerView) {
          case TABLE_VIEW_MODE.LIST:
            return (
              <Table
                columns={servicetemplateTable.columns()}
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
                {items?.map(({ NAME, ID, GNAME, UNAME, TEMPLATE, LABELS }) => (
                  <ServiceTemplate.Card
                    key={ID}
                    NAME={NAME}
                    ID={ID}
                    GNAME={GNAME}
                    UNAME={UNAME}
                    REGTIME={TEMPLATE?.BODY?.registration_time ?? 0}
                    LABELS={LABELS}
                    TEMPLATE={TEMPLATE}
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
                ))}
              </List>
            )
        }
      })()}
      <DetailsDrawer
        selectedTemplates={selectedTemplates}
        handleClose={handleClose}
        handleSelect={handleSelect}
        handleDeselect={handleDeselect}
        actions={availableActions}
      />
    </ResourceContainer>
  )
}
