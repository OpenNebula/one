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
import { RESOURCE_NAMES, T, TABLE_VIEW_MODE } from '@ConstantsModule'
import {
  useFunctionality,
  useFunctionalityApi,
  useViews,
} from '@FeaturesModule'
import {
  getUserQuotaUsage,
  getUserState,
  userTable,
  USER_LIST_COLUMNS,
} from '@ModelsModule'
import { DetailsDrawer } from '@modules/containers/Users/Details'
import { ReactElement, useCallback, useMemo } from 'react'

/**
 * Displays a list of Users.
 *
 * @returns {ReactElement} Users list
 */
export function Users() {
  const {
    searchExpression,
    sortExpression,
    filterExpression,
    selectedItems,
    containerView,
  } = useFunctionality()
  const { setSelectedItems } = useFunctionalityApi()
  const { getResourceView } = useViews()
  const userViewFilters = getResourceView(RESOURCE_NAMES.USER)?.filters ?? {}

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refresh,
  } = userTable.useData()

  const filterOptions = useMemo(
    () =>
      userTable.filterOptions(data, userViewFilters, undefined, [
        {
          id: 'state',
          header: T.Status,
          accessorFn: (user) => getUserState(user)?.name,
        },
      ]),
    [data, userViewFilters]
  )

  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()

    const filteredData = search
      ? data?.filter((user) => {
          const {
            ID,
            NAME,
            GNAME,
            AUTH_DRIVER,
            VM_QUOTA,
            DATASTORE_QUOTA,
            NETWORK_QUOTA,
            IMAGE_QUOTA,
          } = user

          const state = getUserState(user)
          const vmQuotaUsage = getUserQuotaUsage('VM', VM_QUOTA ?? {})
          const datastoreQuotaUsage = getUserQuotaUsage(
            'DATASTORE',
            DATASTORE_QUOTA ?? {}
          )
          const networkQuotaUsage = getUserQuotaUsage(
            'NETWORK',
            NETWORK_QUOTA ?? {}
          )
          const imageQuotaUsage = getUserQuotaUsage('IMAGE', IMAGE_QUOTA ?? {})

          return [
            ID,
            NAME,
            GNAME,
            AUTH_DRIVER,
            state?.name,
            datastoreQuotaUsage?.size?.percentLabel,
            vmQuotaUsage?.vms?.percentLabel,
            networkQuotaUsage?.leases?.percentLabel,
            imageQuotaUsage?.rvms?.percentLabel,
          ]
            .filter((value) => value || value === 0)
            .some((value) => String(value).toLowerCase().includes(search))
        })
      : data

    const filteredByFilters = userTable.filterData(
      filteredData,
      filterExpression,
      filterOptions
    )

    return userTable.sortData(filteredByFilters, sortExpression)
  }, [data, searchExpression, sortExpression, filterExpression, filterOptions])

  const rowSelection = useMemo(
    () =>
      Object.fromEntries((selectedItems ?? []).map((id) => [String(id), true])),
    [selectedItems]
  )

  const selectedUsers = useMemo(
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
      dataCy={userTable.dataCy}
      resourceName={T.Users}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      sortOptions={userTable.sortOptions()}
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
                dataCy={userTable.dataCy}
                columns={userTable.columns(USER_LIST_COLUMNS)}
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
                {items?.map((user) => {
                  const {
                    ID,
                    NAME,
                    GNAME,
                    AUTH_DRIVER,
                    VM_QUOTA,
                    DATASTORE_QUOTA,
                    NETWORK_QUOTA,
                    IMAGE_QUOTA,
                  } = user
                  const id = String(ID)
                  const state = getUserState(user)
                  const vmQuotaUsage = getUserQuotaUsage('VM', VM_QUOTA ?? {})
                  const datastoreQuotaUsage = getUserQuotaUsage(
                    'DATASTORE',
                    DATASTORE_QUOTA ?? {}
                  )
                  const networkQuotaUsage = getUserQuotaUsage(
                    'NETWORK',
                    NETWORK_QUOTA ?? {}
                  )
                  const imageQuotaUsage = getUserQuotaUsage(
                    'IMAGE',
                    IMAGE_QUOTA ?? {}
                  )

                  return (
                    <Card
                      key={id}
                      dataCy={`${userTable.dataCy}-${id}`}
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
                            status:
                              state?.shortName === 'on'
                                ? 'success'
                                : 'disabled',
                            statusName: state?.name,
                          },
                        ],
                        [
                          OwnershipSlot,
                          {
                            labels: [
                              [T.ID, id],
                              [T.Group, GNAME],
                              [T.AuthDriver, AUTH_DRIVER],
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
        selectedUsers={selectedUsers}
        handleClose={handleClose}
        handleSelect={handleSelect}
        handleDeselect={handleDeselect}
      />
    </ResourceContainer>
  )
}
