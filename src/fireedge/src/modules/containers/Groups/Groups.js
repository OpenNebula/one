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

import {
  Card,
  List,
  OwnershipSlot,
  ProgressBarSlot,
  ResourceContainer,
  Table,
  TitleSlot,
} from '@ComponentsV2Module'
import { T, TABLE_VIEW_MODE } from '@ConstantsModule'
import { useFunctionality, useFunctionalityApi } from '@FeaturesModule'
import {
  getGroupQuotaUsage,
  GROUP_LIST_COLUMNS,
  groupTable,
} from '@ModelsModule'
import { DetailsDrawer } from '@modules/containers/Groups/Details'
import { getTotalOfResources } from '@UtilsModule'
import { ReactElement, useCallback, useMemo } from 'react'

/**
 * Displays a list of Groups.
 *
 * @returns {ReactElement} Groups list
 */
export function Groups() {
  const { searchExpression, sortExpression, selectedItems, containerView } =
    useFunctionality()
  const { setSelectedItems } = useFunctionalityApi()

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refresh,
  } = groupTable.useData()

  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()
    const filteredData = search
      ? data?.filter((group) => {
          const {
            ID,
            NAME,
            USERS,
            VM_QUOTA,
            DATASTORE_QUOTA,
            NETWORK_QUOTA,
            IMAGE_QUOTA,
          } = group
          const totalUsers = getTotalOfResources(USERS)
          const vmQuotaUsage = getGroupQuotaUsage('VM', VM_QUOTA ?? {})
          const datastoreQuotaUsage = getGroupQuotaUsage(
            'DATASTORE',
            DATASTORE_QUOTA ?? {}
          )
          const networkQuotaUsage = getGroupQuotaUsage(
            'NETWORK',
            NETWORK_QUOTA ?? {}
          )
          const imageQuotaUsage = getGroupQuotaUsage('IMAGE', IMAGE_QUOTA ?? {})

          return [
            ID,
            NAME,
            totalUsers,
            datastoreQuotaUsage?.size?.percentLabel,
            vmQuotaUsage?.vms?.percentLabel,
            networkQuotaUsage?.leases?.percentLabel,
            imageQuotaUsage?.rvms?.percentLabel,
          ]
            .filter((value) => value || value === 0)
            .some((value) => String(value).toLowerCase().includes(search))
        })
      : data

    return groupTable.sortData(filteredData, sortExpression)
  }, [data, searchExpression, sortExpression])

  const rowSelection = useMemo(
    () =>
      Object.fromEntries((selectedItems ?? []).map((id) => [String(id), true])),
    [selectedItems]
  )

  const selectedGroups = useMemo(
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

  const handleDeselect = (ID) => {
    const id = String(ID)

    setSelectedItems(
      (selectedItems ?? []).filter((itemId) => String(itemId) !== id)
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
      dataCy={groupTable.dataCy}
      resourceName={T.Groups}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      sortOptions={groupTable.sortOptions()}
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
                dataCy={groupTable.dataCy}
                columns={groupTable.columns(GROUP_LIST_COLUMNS)}
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
                {items?.map((group) => {
                  const {
                    ID,
                    NAME,
                    USERS,
                    VM_QUOTA,
                    DATASTORE_QUOTA,
                    NETWORK_QUOTA,
                    IMAGE_QUOTA,
                  } = group
                  const id = String(ID)
                  const totalUsers = getTotalOfResources(USERS)
                  const vmQuotaUsage = getGroupQuotaUsage('VM', VM_QUOTA ?? {})
                  const datastoreQuotaUsage = getGroupQuotaUsage(
                    'DATASTORE',
                    DATASTORE_QUOTA ?? {}
                  )
                  const networkQuotaUsage = getGroupQuotaUsage(
                    'NETWORK',
                    NETWORK_QUOTA ?? {}
                  )
                  const imageQuotaUsage = getGroupQuotaUsage(
                    'IMAGE',
                    IMAGE_QUOTA ?? {}
                  )

                  return (
                    <Card
                      key={id}
                      dataCy={`${groupTable.dataCy}-${id}`}
                      isSelected={selectedItems?.includes(id)}
                      onCheck={() =>
                        setSelectedItems(
                          selectedItems?.includes(id)
                            ? selectedItems.filter((itemId) => itemId !== id)
                            : [...(selectedItems ?? []), id]
                        )
                      }
                      onClick={() => handleSelect(id)}
                      slots={[
                        [
                          TitleSlot,
                          {
                            title: NAME,
                          },
                        ],
                        [
                          OwnershipSlot,
                          {
                            labels: [
                              [T.ID, id],
                              [T.Users, String(totalUsers)],
                            ],
                          },
                        ],
                        [
                          ProgressBarSlot,
                          {
                            bars: [
                              {
                                label: `${T.DatastoreSize} ${
                                  datastoreQuotaUsage?.size?.percentLabel ?? '-'
                                }`,
                                value:
                                  datastoreQuotaUsage?.size?.percentOfUsed ?? 0,
                                isLabelVisible: true,
                              },
                              {
                                label: `${T.VMCount} ${
                                  vmQuotaUsage?.vms?.percentLabel ?? '-'
                                }`,
                                value: vmQuotaUsage?.vms?.percentOfUsed ?? 0,
                                isLabelVisible: true,
                              },
                              {
                                label: `${T.NetworkLeases} ${
                                  networkQuotaUsage?.leases?.percentLabel ?? '-'
                                }`,
                                value:
                                  networkQuotaUsage?.leases?.percentOfUsed ?? 0,
                                isLabelVisible: true,
                              },
                              {
                                label: `${T.ImageRVMS} ${
                                  imageQuotaUsage?.rvms?.percentLabel ?? '-'
                                }`,
                                value:
                                  imageQuotaUsage?.rvms?.percentOfUsed ?? 0,
                                isLabelVisible: true,
                              },
                            ],
                          },
                        ],
                      ]}
                    />
                  )
                })}
              </List>
            )
        }
      })()}
      <DetailsDrawer
        selectedGroups={selectedGroups}
        handleClose={handleClose}
        handleSelect={handleSelect}
        handleDeselect={handleDeselect}
      />
    </ResourceContainer>
  )
}
