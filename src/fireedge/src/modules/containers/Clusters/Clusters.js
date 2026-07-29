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
import { clusterTable } from '@ModelsModule'
import { Cluster } from '@ResourcesModule'
import { getActionsAvailable, getTotalOfResources } from '@UtilsModule'
import { ReactElement, useCallback, useMemo } from 'react'

import { DetailsDrawer } from '@modules/containers/Clusters/Details'

/**
 * Displays a list of Clusters.
 *
 * @returns {ReactElement} Clusters list
 */
export function Clusters() {
  const {
    searchExpression,
    sortExpression,
    selectedItems = [],
    containerView,
  } = useFunctionality()
  const { setSelectedItems } = useFunctionalityApi()
  const { getResourceView } = useViews()

  const availableActions = useMemo(
    () => getActionsAvailable(getResourceView(RESOURCE_NAMES.CLUSTER)?.actions),
    [getResourceView]
  )

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refresh,
  } = clusterTable.useData()

  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()
    const filteredData = search
      ? data?.filter((cluster) =>
          [
            cluster?.ID,
            cluster?.NAME,
            getTotalOfResources(cluster?.HOSTS),
            getTotalOfResources(cluster?.DATASTORES),
            getTotalOfResources(cluster?.VNETS),
            cluster?.TEMPLATE?.ONEFORM?.DRIVER,
          ]
            .filter((value) => value || value === 0)
            .some((value) => String(value).toLowerCase().includes(search))
        )
      : data

    return clusterTable.sortData(filteredData, sortExpression)
  }, [data, searchExpression, sortExpression])

  const selectedClusters = useMemo(
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
      dataCy={clusterTable.dataCy}
      resourceName={T.Clusters}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      sortOptions={clusterTable.sortOptions()}
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
                dataCy={clusterTable.dataCy}
                columns={clusterTable.columns()}
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
                {items?.map((cluster) => {
                  const id = String(cluster?.ID)

                  return (
                    <Cluster.Card
                      key={id}
                      dataCy={`${clusterTable.dataCy}-${id}`}
                      cluster={cluster}
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
        selectedClusters={selectedClusters}
        handleClose={handleClose}
        handleSelect={handleSelect}
        handleDeselect={handleDeselect}
        actions={availableActions}
      />
    </ResourceContainer>
  )
}
