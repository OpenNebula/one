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
import { RESOURCE_NAMES, T, TABLE_VIEW_MODE } from '@ConstantsModule'
import {
  useFunctionalityApi,
  useFunctionality,
  useViews,
} from '@FeaturesModule'
import { DetailsDrawer } from '@modules/containers/SecurityGroups/Details'
import { securitygroupTable } from '@ModelsModule'
import { getActionsAvailable, getTotalOfResources } from '@UtilsModule'
import { SecurityGroup } from '@ResourcesModule'

import { ReactElement, useMemo, useCallback } from 'react'

/**
 * Displays a list of Security Groups with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} Security Groups list and selected row(s)
 */
export function SecurityGroups() {
  const { searchExpression, sortExpression, selectedItems, containerView } =
    useFunctionality()
  const { getResourceView } = useViews()

  const availableActions = useMemo(
    () => getActionsAvailable(getResourceView(RESOURCE_NAMES.SEC_GROUP)),
    [getResourceView]
  )

  const { setSelectedItems } = useFunctionalityApi()

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refresh,
  } = securitygroupTable.useData()

  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()
    const filteredData = search
      ? data?.filter((securityGroup) => {
          const {
            ERROR_VMS,
            GNAME,
            ID,
            NAME,
            OUTDATED_VMS,
            TEMPLATE,
            UNAME,
            UPDATED_VMS,
          } = securityGroup
          const totalRules = []
            .concat(TEMPLATE?.RULE ?? [])
            .filter(Boolean).length

          return [
            ID,
            NAME,
            UNAME,
            GNAME,
            getTotalOfResources(UPDATED_VMS),
            getTotalOfResources(OUTDATED_VMS),
            getTotalOfResources(ERROR_VMS),
            totalRules,
            TEMPLATE?.LABELS,
          ]
            .filter((value) => value || value === 0)
            .some((value) => String(value).toLowerCase().includes(search))
        })
      : data

    return securitygroupTable.sortData(filteredData, sortExpression)
  }, [data, searchExpression, sortExpression])

  const selectedSecurityGroups = useMemo(
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
      dataCy={securitygroupTable.dataCy}
      resourceName={T.SecurityGroups}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      sortOptions={securitygroupTable.sortOptions()}
      searchPlaceholder={T.SearchSecurityGroups}
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
                dataCy={securitygroupTable.dataCy}
                columns={securitygroupTable.columns()}
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
                {items?.map((securityGroup) => {
                  const { ID } = securityGroup

                  return (
                    <SecurityGroup.Card
                      key={ID}
                      dataCy={`${securitygroupTable.dataCy}-${ID}`}
                      securityGroup={securityGroup}
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
                  )
                })}
              </List>
            )
        }
      })()}
      <DetailsDrawer
        selectedSecurityGroups={selectedSecurityGroups}
        handleClose={handleClose}
        handleSelect={handleSelect}
        handleDeselect={handleDeselect}
        actions={availableActions}
      />
    </ResourceContainer>
  )
}
