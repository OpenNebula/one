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
} from '@ComponentsModule'
import {
  DRIVER_ACTIONS,
  RESOURCE_NAMES,
  STATES,
  T,
  TABLE_VIEW_MODE,
} from '@ConstantsModule'
import {
  DriverAPI,
  useFunctionality,
  useFunctionalityApi,
  useModalsApi,
  useViews,
} from '@FeaturesModule'
import { driverTable } from '@ModelsModule'
import { getActionsAvailable } from '@UtilsModule'
import { ReactElement, useCallback, useMemo } from 'react'
import { DriverDetails } from '@modules/containers/Drivers/Details'

/**
 * Displays the driver pool with the design system resource flow.
 *
 * @returns {ReactElement} Driver list and details
 */
export function Drivers() {
  const {
    searchExpression,
    sortExpression,
    filterExpression,
    selectedItems = [],
  } = useFunctionality()
  const { setSelectedItems } = useFunctionalityApi()
  const { getResourceView } = useViews()
  const { showModal } = useModalsApi()
  const resourceView = getResourceView(RESOURCE_NAMES.DRIVER)
  const availableActions = useMemo(
    () => getActionsAvailable(resourceView?.actions),
    [resourceView?.actions]
  )

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refresh,
    error,
  } = driverTable.useData()
  const [enable, { isLoading: isEnabling }] =
    DriverAPI.useEnableDriverMutation()
  const [disable, { isLoading: isDisabling }] =
    DriverAPI.useDisableDriverMutation()
  const [sync, { isLoading: isSyncing }] = DriverAPI.useSyncDriversMutation()

  const filterOptions = useMemo(
    () => driverTable.filterOptions(data, resourceView?.filters),
    [data, resourceView?.filters]
  )
  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()
    const searched = search
      ? data.filter(({ name, description, state }) =>
          [name, description, state].some((value) =>
            String(value ?? '')
              .toLowerCase()
              .includes(search)
          )
        )
      : data
    const filtered = driverTable.filterData(
      searched,
      filterExpression,
      filterOptions
    )

    return driverTable.sortData(filtered, sortExpression)
  }, [data, filterExpression, filterOptions, searchExpression, sortExpression])

  const selectedDrivers = useMemo(
    () =>
      items.filter(({ name }) => selectedItems.includes(String(name))) ?? [],
    [items, selectedItems]
  )
  const rowSelection = useMemo(
    () => Object.fromEntries(selectedItems.map((name) => [String(name), true])),
    [selectedItems]
  )

  const handleRowSelectionChange = useCallback(
    (updater) => {
      const next =
        typeof updater === 'function' ? updater(rowSelection) : updater
      setSelectedItems(Object.keys(next).filter((name) => next[name]))
    },
    [rowSelection, setSelectedItems]
  )
  const handleSelect = (name) => {
    const id = String(name)
    setSelectedItems(
      selectedItems.length === 1 && selectedItems[0] === id ? [] : [id]
    )
  }
  const handleClose = () => setSelectedItems([])

  const confirmAction = useCallback(
    ({ title, mutation, resources = selectedDrivers }) => {
      showModal({
        isConfirmDialog: true,
        dialogProps: {
          title,
          description: (
            <ResourceActionConfirmation
              description={T.DoYouWantProceed}
              resources={resources.map(({ name }) => ({
                ID: name,
                NAME: name,
              }))}
              resourceType={T.Drivers}
            />
          ),
          confirmLabel: title,
        },
        onSubmit: mutation,
      })
    },
    [selectedDrivers, showModal]
  )

  const selectedCount = selectedDrivers.length
  const isMutating = isEnabling || isDisabling || isSyncing
  const extraSlots = useMemo(
    () => [
      [
        () => (
          <>
            {availableActions.includes(DRIVER_ACTIONS.SYNC) && (
              <Button
                type="secondary"
                size="medium"
                isDisabled={selectedCount > 0 || isMutating}
                onClick={() =>
                  confirmAction({
                    title: T.Synchronize,
                    resources: [],
                    mutation: () => sync(),
                  })
                }
              >
                {T.Synchronize}
              </Button>
            )}
            {availableActions.includes(DRIVER_ACTIONS.ENABLE) && (
              <Button
                type="secondary"
                size="medium"
                isDisabled={
                  selectedCount === 0 ||
                  isMutating ||
                  selectedDrivers.every(({ state }) => state === STATES.ENABLED)
                }
                onClick={() =>
                  confirmAction({
                    title: T.Enable,
                    mutation: () =>
                      Promise.all(
                        selectedDrivers.map(({ name }) =>
                          enable({ name: name.toLowerCase() })
                        )
                      ),
                  })
                }
              >
                {T.Enable}
              </Button>
            )}
            {availableActions.includes(DRIVER_ACTIONS.DISABLE) && (
              <Button
                type="secondary"
                size="medium"
                isDisabled={
                  selectedCount === 0 ||
                  isMutating ||
                  selectedDrivers.every(
                    ({ state }) => state === STATES.DISABLED
                  )
                }
                onClick={() =>
                  confirmAction({
                    title: T.Disable,
                    mutation: () =>
                      Promise.all(
                        selectedDrivers.map(({ name }) =>
                          disable({ name: name.toLowerCase() })
                        )
                      ),
                  })
                }
              >
                {T.Disable}
              </Button>
            )}
          </>
        ),
        {},
        { display: 'flex', gap: 1 },
      ],
    ],
    [
      availableActions,
      confirmAction,
      disable,
      enable,
      isMutating,
      selectedCount,
      selectedDrivers,
      sync,
    ]
  )

  return (
    <ResourceContainer
      dataCy={driverTable.dataCy}
      resourceName={T.Drivers}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      sortOptions={driverTable.sortOptions()}
      filterOptions={filterOptions}
      extraSlots={extraSlots}
      viewMode={TABLE_VIEW_MODE.LIST}
      count={items.length}
      selectedCount={selectedCount}
      unavailableMessage={
        error?.status === 500 ? T.CannotConnectOneForm : undefined
      }
      onSelectAll={(checked) =>
        setSelectedItems(checked ? items.map(({ name }) => String(name)) : [])
      }
    >
      <Table
        dataCy={driverTable.dataCy}
        columns={driverTable.columns()}
        data={items}
        isLoading={isRefreshing}
        isRowsSelectable
        isMultiRowSelection
        isCopyColumn
        rowSelection={rowSelection}
        onRowSelectionChange={handleRowSelectionChange}
        getRowId={(row) => String(row.name)}
        onRowClick={(row) => handleSelect(row.name)}
        size="medium"
        defaultPageSize={25}
        isFullHeight
      />
      <DriverDetails
        selectedDriver={
          selectedDrivers.length === 1 ? selectedDrivers[0] : undefined
        }
        handleClose={handleClose}
      />
    </ResourceContainer>
  )
}
