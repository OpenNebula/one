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
import { List, Table, ResourceContainer } from '@ComponentsV2Module'

import { T, TABLE_VIEW_MODE, RESOURCE_NAMES } from '@ConstantsModule'
import {
  useGeneral,
  useFunctionalityApi,
  useFunctionality,
  useViews,
} from '@FeaturesModule'
import { ReactElement, useMemo, useCallback } from 'react'
import { DetailsDrawer } from '@modules/containers/Datastores/Details'
import {
  datastoreTable,
  getDatastoreCapacityInfo,
  getDatastoreState,
  getDatastoreType,
} from '@ModelsModule'
import { Datastore } from '@ResourcesModule'

/**
 * Displays a list of Datastores with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} Datastores list and selected row(s)
 */
export function Datastores() {
  const { zone } = useGeneral()
  const { searchExpression, sortExpression, selectedItems, containerView } =
    useFunctionality()

  const { getResourceView } = useViews()
  const availableActions = useMemo(
    () => getResourceView(RESOURCE_NAMES.DATASTORE)?.actions ?? {},
    [getResourceView]
  )

  const { setSelectedItems } = useFunctionalityApi()

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refresh,
  } = datastoreTable.useData({ zone })

  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()
    const filteredData = search
      ? data?.filter((datastore) => {
          const { ID, NAME, UNAME, GNAME, CLUSTERS, TEMPLATE } = datastore
          const state = getDatastoreState(datastore)
          const capacity = getDatastoreCapacityInfo(datastore)
          const type = getDatastoreType(datastore)
          const clusters = [CLUSTERS?.ID ?? []].flat().join(', ')

          return [
            ID,
            NAME,
            state?.name,
            capacity?.percentLabel,
            type,
            clusters,
            UNAME,
            GNAME,
            TEMPLATE?.LABELS,
          ]
            .filter((value) => value || value === 0)
            .some((value) => String(value).toLowerCase().includes(search))
        })
      : data

    return datastoreTable.sortData(filteredData, sortExpression)
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
      resourceName={T.Datastores}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      sortOptions={datastoreTable.sortOptions()}
      searchPlaceholder={T.SearchDatastores}
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
                columns={datastoreTable.columns()}
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
                {items?.map((datastore) => (
                  <Datastore.Card
                    key={datastore?.ID}
                    data={datastore}
                    isSelected={selectedItems?.includes(datastore?.ID)}
                    onCheck={() =>
                      setSelectedItems(
                        selectedItems?.includes(datastore?.ID)
                          ? selectedItems.filter((id) => id !== datastore?.ID)
                          : [...(selectedItems ?? []), datastore?.ID]
                      )
                    }
                    onClick={() => handleSelect(datastore?.ID)}
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
