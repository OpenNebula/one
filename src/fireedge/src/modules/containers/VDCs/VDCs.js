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
import { useFunctionality, useFunctionalityApi } from '@FeaturesModule'
import {
  getVdcClustersCount,
  getVdcDatastoresCount,
  getVdcGroupsCount,
  getVdcHostsCount,
  getVdcVnetsCount,
  VDC_LIST_COLUMNS,
  vdcTable,
} from '@ModelsModule'
import { Vdc } from '@ResourcesModule'
import { DetailsDrawer } from '@modules/containers/VDCs/Details'
import { ReactElement, useCallback, useMemo } from 'react'

/**
 * Displays a list of VDCs.
 *
 * @returns {ReactElement} VDCs list
 */
export function VDCs() {
  const { searchExpression, sortExpression, selectedItems, containerView } =
    useFunctionality()
  const { setSelectedItems } = useFunctionalityApi()

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refresh,
  } = vdcTable.useData()

  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()
    const filteredData = search
      ? data?.filter((vdc) =>
          [
            vdc?.ID,
            vdc?.NAME,
            getVdcGroupsCount(vdc),
            getVdcClustersCount(vdc),
            getVdcHostsCount(vdc),
            getVdcDatastoresCount(vdc),
            getVdcVnetsCount(vdc),
          ]
            .filter((value) => value || value === 0)
            .some((value) => String(value).toLowerCase().includes(search))
        )
      : data

    return vdcTable.sortData(filteredData, sortExpression)
  }, [data, searchExpression, sortExpression])

  const rowSelection = useMemo(
    () =>
      Object.fromEntries((selectedItems ?? []).map((id) => [String(id), true])),
    [selectedItems]
  )

  const selectedVdcs = useMemo(
    () => items?.filter(({ ID }) => selectedItems?.includes(String(ID))) ?? [],
    [items, selectedItems]
  )

  const handleClose = () => setSelectedItems([])

  const handleSelect = (ID) => {
    const id = String(ID)

    setSelectedItems(
      selectedItems?.length === 1 && selectedItems?.[0] === id ? [] : [id]
    )
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
      dataCy={vdcTable.dataCy}
      resourceName={T.VDCs}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      sortOptions={vdcTable.sortOptions()}
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
                dataCy={vdcTable.dataCy}
                columns={vdcTable.columns(VDC_LIST_COLUMNS)}
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
              />
            )
          case TABLE_VIEW_MODE.CARD:
          default:
            return (
              <List isRowIndicatorDisabled={true} isLoading={isRefreshing}>
                {items?.map((vdc) => {
                  const { ID } = vdc
                  const id = String(ID)

                  return (
                    <Vdc.Card
                      key={id}
                      vdc={vdc}
                      dataCy={`${vdcTable.dataCy}-${id}`}
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
      <DetailsDrawer selectedVdcs={selectedVdcs} handleClose={handleClose} />
    </ResourceContainer>
  )
}
