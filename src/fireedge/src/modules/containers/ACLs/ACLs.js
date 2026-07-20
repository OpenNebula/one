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
  Button,
  ResourceActionConfirmation,
  ResourceContainer,
  Table,
} from '@ComponentsV2Module'
import { RESOURCE_NAMES, T, TABLE_VIEW_MODE } from '@ConstantsModule'
import {
  AclAPI,
  useFunctionality,
  useFunctionalityApi,
  useModalsApi,
  useViews,
} from '@FeaturesModule'
import { aclTable, ACL_LIST_COLUMNS, getAclSearchValue } from '@ModelsModule'
import { Trash } from 'iconoir-react'
import { ReactElement, useCallback, useMemo } from 'react'

/**
 * Displays a list of ACL rules.
 *
 * @returns {ReactElement} ACLs list
 */
export function ACLs() {
  const { searchExpression, sortExpression, filterExpression, selectedItems } =
    useFunctionality()
  const { setSelectedItems } = useFunctionalityApi()
  const { getResourceView } = useViews()
  const resourceViewFilters = getResourceView(RESOURCE_NAMES.ACL)?.filters
  const { showModal } = useModalsApi()
  const [remove, { isLoading: isRemoving }] = AclAPI.useRemoveAclMutation()
  const selectedCount = selectedItems?.length ?? 0

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refresh,
  } = aclTable.useData()

  const filterOptions = useMemo(
    () =>
      aclTable.filterOptions(data, resourceViewFilters, undefined, [
        { id: 'id', header: T.ID, accessorKey: 'ID' },
      ]),
    [data, resourceViewFilters]
  )

  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()
    const filteredData = search
      ? data?.filter((acl) => getAclSearchValue(acl).includes(search))
      : data

    const filteredByFilters = aclTable.filterData(
      filteredData,
      filterExpression,
      filterOptions
    )

    return aclTable.sortData(
      filteredByFilters,
      sortExpression,
      ACL_LIST_COLUMNS
    )
  }, [data, searchExpression, sortExpression, filterExpression, filterOptions])

  const rowSelection = useMemo(
    () =>
      Object.fromEntries((selectedItems ?? []).map((id) => [String(id), true])),
    [selectedItems]
  )

  const handleSelect = (ID) => {
    const id = String(ID)

    setSelectedItems(
      selectedItems?.length === 1 && selectedItems?.[0] === id ? [] : [id]
    )
  }

  const handleOpenDeleteForm = useCallback(() => {
    const selectedIds = selectedItems ?? []

    if (selectedIds.length === 0) return

    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: [T.Delete, T.ACLs].filter(Boolean).join(' '),
        description: (
          <ResourceActionConfirmation
            description={T.DoYouWantProceed}
            resources={selectedIds.map((id) => ({ ID: id }))}
            resourceType={T.ACLs}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await Promise.all(selectedIds.map((id) => remove({ id })))
        setSelectedItems([])
      },
    })
  }, [remove, selectedItems, setSelectedItems, showModal])

  const handleRowSelectionChange = useCallback(
    (updater) => {
      const next =
        typeof updater === 'function' ? updater(rowSelection) : updater
      setSelectedItems(Object.keys(next).filter((id) => next[id]))
    },
    [rowSelection, setSelectedItems]
  )

  const extraSlots = useMemo(
    () => [
      [
        () => (
          <Button
            data-cy="delete-selected-acls"
            type="secondary"
            size="medium"
            startIcon={<Trash width="16px" height="16px" />}
            isDestructive
            isDisabled={selectedCount === 0 || isRemoving}
            onClick={handleOpenDeleteForm}
          >
            {T.DeleteSelected}
          </Button>
        ),
        {},
        { flex: '0 0 auto' },
      ],
    ],
    [handleOpenDeleteForm, isRemoving, selectedCount]
  )

  return (
    <ResourceContainer
      dataCy={aclTable.dataCy}
      resourceName={T.ACLs}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      sortOptions={aclTable.sortOptions(ACL_LIST_COLUMNS)}
      filterOptions={filterOptions}
      extraSlots={extraSlots}
      viewMode={TABLE_VIEW_MODE.LIST}
      count={items?.length}
    >
      <Table
        dataCy={aclTable.dataCy}
        columns={aclTable.columns(ACL_LIST_COLUMNS)}
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
    </ResourceContainer>
  )
}
