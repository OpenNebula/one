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
import { DetailsDrawer } from '@modules/containers/Images/Details'
import { getImageState, getImageType, imageTable } from '@ModelsModule'
import { prettyBytes, timeFromMilliseconds } from '@UtilsModule'
import { Image as ImageResource } from '@ResourcesModule'

/**
 * Displays a list of Images with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} Images list and selected row(s)
 */
export function Images() {
  const { zone } = useGeneral()
  const {
    searchExpression,
    sortExpression,
    filterExpression,
    selectedItems,
    containerView,
  } = useFunctionality()

  const { getResourceView } = useViews()
  const resourceView = getResourceView(RESOURCE_NAMES.IMAGE)
  const availableActions = useMemo(
    () => resourceView?.actions ?? {},
    [resourceView?.actions]
  )

  const { setSelectedItems } = useFunctionalityApi()

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refresh,
  } = imageTable.useData({ zone })

  const filterOptions = useMemo(
    () =>
      imageTable.filterOptions(data, resourceView?.filters, undefined, [
        {
          id: 'locked',
          header: T.Locked,
          accessorFn: (image) => (image?.LOCK ? T.Locked : T.Unlocked),
        },
      ]),
    [data, resourceView?.filters]
  )

  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()
    const filteredData = search
      ? data?.filter((image) => {
          const {
            ID,
            NAME,
            UNAME,
            GNAME,
            REGTIME,
            PERSISTENT,
            DATASTORE,
            RUNNING_VMS,
            SIZE,
          } = image
          const state = getImageState(image)
          const type = getImageType(image)

          return [
            ID,
            NAME,
            DATASTORE,
            type,
            state?.name,
            RUNNING_VMS,
            UNAME,
            GNAME,
            +PERSISTENT ? T.Persistent : T.NonPersistent,
            prettyBytes(+SIZE || 0, 'MB'),
            REGTIME && timeFromMilliseconds(+REGTIME).toRelative(),
          ]
            .filter((value) => value || value === 0)
            .some((value) => String(value).toLowerCase().includes(search))
        })
      : data

    const filteredByFilters = imageTable.filterData(
      filteredData,
      filterExpression,
      filterOptions
    )

    return imageTable.sortData(filteredByFilters, sortExpression)
  }, [data, searchExpression, sortExpression, filterExpression, filterOptions])

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
      resourceName={T.Images}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      sortOptions={imageTable.sortOptions()}
      filterOptions={filterOptions}
      searchPlaceholder={T.SearchImages}
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
                columns={imageTable.columns()}
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
                {items?.map((image) => (
                  <ImageResource.Card
                    key={image?.ID}
                    data={image}
                    isSelected={selectedItems?.includes(image?.ID)}
                    onCheck={() =>
                      setSelectedItems(
                        selectedItems?.includes(image?.ID)
                          ? selectedItems.filter((id) => id !== image?.ID)
                          : [...(selectedItems ?? []), image?.ID]
                      )
                    }
                    onClick={() => handleSelect(image?.ID)}
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
