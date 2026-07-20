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
import { List, ResourceContainer, Table, Text } from '@ComponentsV2Module'
import { ReactElement, useCallback, useMemo, useState } from 'react'
import { Box, Divider } from '@mui/material'
import {
  RESOURCE_NAMES,
  T,
  TABLE_VIEW_MODE,
  TEXT_VARIANTS,
  TEXT_WEIGHTS,
} from '@ConstantsModule'

import {
  SupportAPI,
  useFunctionality,
  useFunctionalityApi,
  useGeneralApi,
  useSupportAuth,
  useSupportAuthApi,
  useViews,
} from '@FeaturesModule'
import { getSupportState, supportTable } from '@ModelsModule'
import { getActionsAvailable } from '@UtilsModule'
import { Support as SupportResource } from '@ResourcesModule'
import { AuthenticationForm as AuthForm } from '@modules/containers/Support/Authentication'
import { InformationSettings as Information } from '@modules/containers/Support/Information'
import { DocumentationSettings as Documentation } from '@modules/containers/Support/Documentation'
import { DetailsDrawer } from '@modules/containers/Support/Details'

/** @returns {ReactElement} Support container */
export const Support = () => {
  const [login, loginState] = SupportAPI.useLoginSupportMutation()
  const isLoading = loginState.isLoading
  const [dataUserForm] = useState(undefined)
  const { enqueueError } = useGeneralApi()
  const { user: userState } = useSupportAuth()
  const { changeSupportAuthUser } = useSupportAuthApi()

  const handleSubmit = async (dataForm) => {
    try {
      const { user } = await login({
        ...dataUserForm,
        ...dataForm,
      }).unwrap()

      if (user) {
        changeSupportAuthUser(user)
      } else {
        enqueueError(T.ErrorSupportCredentials)
      }
    } catch {}
  }

  return !userState ? (
    <>
      <Text
        variant={TEXT_VARIANTS.H5}
        weight={TEXT_WEIGHTS.SEMIBOLD}
        value={T.CommercialSupportRequests}
      />

      <Divider sx={{ my: '1em' }} />

      <Box
        display="grid"
        gridTemplateColumns={{
          sm: '1fr',
          md: 'repeat(2, minmax(49%, 1fr))',
        }}
        gap="1em"
      >
        <Information />

        <AuthForm onSubmit={handleSubmit} isLoading={isLoading} />

        <Documentation />
      </Box>
    </>
  ) : (
    <SupportTickets />
  )
}

/**
 * Displays a list of support tickets.
 *
 * @returns {ReactElement} Support tickets list
 */
function SupportTickets() {
  const {
    searchExpression,
    sortExpression,
    filterExpression,
    selectedItems = [],
    containerView,
  } = useFunctionality()
  const { setSelectedItems } = useFunctionalityApi()
  const { getResourceView } = useViews()
  const resourceView = getResourceView(RESOURCE_NAMES.SUPPORT)

  const availableActions = useMemo(
    () => getActionsAvailable(resourceView?.actions),
    [resourceView?.actions]
  )

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refresh,
  } = supportTable.useData()

  const filterOptions = useMemo(
    () => supportTable.filterOptions(data, resourceView?.filters),
    [data, resourceView?.filters]
  )

  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()
    const filteredData = search
      ? data?.filter((ticket) => {
          const ticketState = ticket?.status
            ? getSupportState(ticket)
            : undefined

          return [
            ticket?.id,
            ticket?.subject,
            ticket?.status,
            ticketState?.name,
          ]
            .filter((value) => value || value === 0)
            .some((value) => String(value).toLowerCase().includes(search))
        })
      : data

    const filteredByFilters = supportTable.filterData(
      filteredData,
      filterExpression,
      filterOptions
    )

    return supportTable.sortData(filteredByFilters, sortExpression)
  }, [data, searchExpression, sortExpression, filterExpression, filterOptions])

  const selectedTickets = useMemo(
    () => items?.filter(({ id }) => selectedItems?.includes(String(id))) ?? [],
    [items, selectedItems]
  )

  const rowSelection = useMemo(
    () => Object.fromEntries(selectedItems.map((id) => [String(id), true])),
    [selectedItems]
  )

  const handleClose = () => setSelectedItems([])

  const handleSelect = (ticketId) => {
    const id = String(ticketId)
    setSelectedItems(
      selectedItems?.length === 1 && selectedItems?.[0] === id ? [] : [id]
    )
  }

  const handleDeselect = (ticketId) => {
    const id = String(ticketId)
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
      resourceName={T.Support}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      sortOptions={supportTable.sortOptions()}
      filterOptions={filterOptions}
      count={items?.length}
      selectedCount={selectedItems?.length}
      onSelectAll={(checked) =>
        setSelectedItems(
          checked ? items?.map(({ id }) => String(id)) ?? [] : []
        )
      }
    >
      {(() => {
        switch (containerView) {
          case TABLE_VIEW_MODE.LIST:
            return (
              <Table
                columns={supportTable.columns()}
                data={items}
                isLoading={isRefreshing}
                isRowsSelectable
                isMultiRowSelection
                isCopyColumn
                rowSelection={rowSelection}
                onRowSelectionChange={handleRowSelectionChange}
                getRowId={(row) => String(row.id)}
                onRowClick={(row) => handleSelect(row.id)}
                size="medium"
                defaultPageSize={25}
                isFullHeight
              />
            )
          case TABLE_VIEW_MODE.CARD:
          default:
            return (
              <List isRowIndicatorDisabled={true} isLoading={isRefreshing}>
                {items?.map((ticket) => {
                  const id = String(ticket?.id)

                  return (
                    <SupportResource.Card
                      key={id}
                      ticket={ticket}
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
        selectedTickets={selectedTickets}
        handleClose={handleClose}
        handleSelect={handleSelect}
        handleDeselect={handleDeselect}
        actions={availableActions}
      />
    </ResourceContainer>
  )
}
