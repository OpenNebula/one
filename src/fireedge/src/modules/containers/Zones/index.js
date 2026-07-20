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

import { T, TABLE_VIEW_MODE } from '@ConstantsModule'
import { ZoneAPI, useFunctionalityApi, useFunctionality } from '@FeaturesModule'
import { ReactElement, useMemo, useCallback } from 'react'
import { DetailsDrawer } from '@modules/containers/Zones/Details'
import { Zone } from '@ResourcesModule'
import { getZoneEndpoint, getZoneState, zoneTable } from '@ModelsModule'

/**
 * Displays a list of Zones.
 *
 * @returns {ReactElement} Zones list
 */
export function Zones() {
  const { searchExpression, sortExpression, selectedItems, containerView } =
    useFunctionality()

  const { setSelectedItems } = useFunctionalityApi()

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refreshZones,
  } = ZoneAPI.useGetZonesQuery()

  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()
    const filteredData = search
      ? data?.filter((zone) =>
          [
            zone?.ID,
            zone?.NAME,
            getZoneState(zone)?.name,
            getZoneEndpoint(zone),
            zone?.TEMPLATE?.ENDPOINT_GRPC,
          ]
            .filter((value) => value || value === 0)
            .some((value) => String(value).toLowerCase().includes(search))
        )
      : data

    return zoneTable.sortData(filteredData, sortExpression)
  }, [data, searchExpression, sortExpression])

  const selectedZones = useMemo(
    () => items?.filter(({ ID }) => selectedItems?.includes(String(ID))) ?? [],
    [items, selectedItems]
  )

  const rowSelection = useMemo(
    () => Object.fromEntries((selectedItems ?? []).map((id) => [id, true])),
    [selectedItems]
  )

  const handleSelect = (ID) => {
    const id = String(ID)
    setSelectedItems(
      selectedItems?.length === 1 && selectedItems?.[0] === id ? [] : [id]
    )
  }

  const handleDeselect = (ID) => {
    const id = String(ID)
    setSelectedItems(selectedItems?.filter((item) => String(item) !== id))
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
      resourceName={T.Zones}
      onRefresh={refreshZones}
      isRefreshing={isRefreshing}
      sortOptions={zoneTable.sortOptions()}
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
                columns={zoneTable.columns()}
                data={items}
                isRowsSelectable
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
                {items?.map((zone) => {
                  const id = String(zone.ID)

                  return (
                    <Zone.Card
                      key={id}
                      zone={zone}
                      isRemoveCheckbox
                      onCheck={() =>
                        setSelectedItems(
                          selectedItems?.includes(id)
                            ? selectedItems.filter((itemId) => itemId !== id)
                            : [...(selectedItems ?? []), id]
                        )
                      }
                      onClick={() => handleSelect(id)}
                      isSelected={selectedItems?.includes(id)}
                    />
                  )
                })}
              </List>
            )
        }
      })()}

      <DetailsDrawer
        selectedZones={selectedZones}
        handleClose={() => setSelectedItems([])}
        handleSelect={handleSelect}
        handleDeselect={handleDeselect}
      />
    </ResourceContainer>
  )
}
