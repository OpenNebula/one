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

import {
  List,
  ResourceContainer,
  StatusTag,
  Table,
  Tag,
} from '@ComponentsV2Module'
import { RESOURCE_NAMES, TABLE_VIEW_MODE, T } from '@ConstantsModule'
import {
  OneKsAPI,
  useFunctionality,
  useFunctionalityApi,
  useGeneral,
  useViews,
} from '@FeaturesModule'
import { createLabelColumn, getVirtualOneKsState } from '@ModelsModule'
import {
  getTableSortOptions,
  sortTableData,
  timeFromMilliseconds,
} from '@UtilsModule'
import { ReactElement, useCallback, useMemo } from 'react'
import { DetailsDrawer } from '@modules/containers/OneKs/Details'
import { OneKs as OneKsResource } from '@ResourcesModule'

const getDocument = (data) => data?.DOCUMENT ?? data ?? {}

const toId = (id) => String(id)

const formatTime = (time) =>
  +time > 0 ? timeFromMilliseconds(+time).toRelative() : '-'

const columns = [
  { header: T.ID, id: 'id', accessorKey: 'ID', grow: false },
  { header: T.Name, id: 'name', accessorKey: 'NAME', truncate: true },
  {
    header: T.State,
    id: 'state',
    accessorFn: (row) => getVirtualOneKsState(row)?.name ?? '',
    cell: ({ row }) => {
      const { color, name } = getVirtualOneKsState(row.original) ?? {}

      return <StatusTag statusColor={color} statusName={name} />
    },
  },
  {
    header: T.Type,
    id: 'type',
    accessorFn: (row) =>
      [].concat(row?.TEMPLATE?.CLUSTER_BODY?.control_plane ?? [])[0]?.flavour ??
      '',
    cell: ({ row }) => {
      const flavour = [].concat(
        row?.original?.TEMPLATE?.CLUSTER_BODY?.control_plane ?? []
      )[0]?.flavour

      return flavour ? <Tag title={flavour} status="default" /> : '-'
    },
  },
  {
    header: T.KubernetesVersion,
    id: 'version',
    accessorFn: (row) => row?.TEMPLATE?.CLUSTER_BODY?.kubernetes_version ?? '',
    cell: ({ row }) => {
      const version = row?.original?.TEMPLATE?.CLUSTER_BODY?.kubernetes_version

      return version ? <Tag title={version} status="default" /> : '-'
    },
  },
  {
    header: T.NodeGroups,
    id: 'node_groups',
    accessorFn: (row) =>
      [].concat(row?.TEMPLATE?.CLUSTER_BODY?.node_groups ?? []).filter(Boolean)
        .length,
  },
  { header: T.Owner, id: 'owner', accessorKey: 'UNAME', grow: false },
  { header: T.Group, id: 'group', accessorKey: 'GNAME', grow: false },
  {
    header: T.Created,
    id: 'registration_time',
    accessorFn: (row) => row?.TEMPLATE?.CLUSTER_BODY?.registration_time ?? 0,
    cell: ({ row }) =>
      formatTime(row?.original?.TEMPLATE?.CLUSTER_BODY?.registration_time),
    grow: false,
  },
  createLabelColumn({ grow: false }),
]

/**
 * Displays a list of Kubernetes clusters with a split pane between the list
 * and selected row(s).
 *
 * @returns {ReactElement} OneKs list and selected row(s)
 */
export function OneKs() {
  const { zone } = useGeneral()
  const { searchExpression, sortExpression, selectedItems, containerView } =
    useFunctionality()

  const { getResourceView } = useViews()
  const availableActions = useMemo(
    () => getResourceView(RESOURCE_NAMES.ONEKS)?.actions ?? {},
    [getResourceView]
  )

  const { setSelectedItems } = useFunctionalityApi()

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refresh,
    error,
  } = OneKsAPI.useGetOneKsClustersQuery(
    { zone },
    {
      selectFromResult: (result) => ({
        ...result,
        data: result?.data?.map(getDocument),
      }),
    }
  )

  const items = useMemo(() => {
    const search = String(searchExpression ?? '').toLowerCase()

    const filteredData = search
      ? data?.filter((cluster) => {
          const { ID, NAME, UNAME, GNAME, TEMPLATE = {} } = cluster
          const { CLUSTER_BODY = {} } = TEMPLATE
          const state = getVirtualOneKsState(cluster)
          const registrationTime = CLUSTER_BODY?.registration_time

          return [
            ID,
            NAME,
            state?.name,
            [].concat(CLUSTER_BODY?.control_plane ?? [])[0]?.flavour,
            CLUSTER_BODY?.kubernetes_version,
            [].concat(CLUSTER_BODY?.node_groups ?? []).filter(Boolean).length,
            registrationTime && formatTime(registrationTime),
            registrationTime &&
              timeFromMilliseconds(+registrationTime).toRelative(),
            UNAME,
            GNAME,
          ]
            .filter((value) => value || value === 0)
            .some((value) => String(value).toLowerCase().includes(search))
        })
      : data

    return sortTableData(filteredData, sortExpression, columns)
  }, [data, searchExpression, sortExpression])

  const selectedData = useMemo(
    () => items?.filter(({ ID }) => selectedItems?.includes(toId(ID))) ?? [],
    [items, selectedItems]
  )

  const rowSelection = useMemo(
    () => Object.fromEntries(selectedItems.map((id) => [id, true])),
    [selectedItems]
  )

  const handleClose = () => setSelectedItems([])
  const handleSelect = (ID) => {
    const id = toId(ID)

    setSelectedItems(
      selectedItems?.length === 1 && selectedItems?.[0] === id ? [] : [id]
    )
  }
  const handleDeselect = (ID) =>
    setSelectedItems(selectedItems.filter((id) => id !== toId(ID)))

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
      resourceName="Kubernetes"
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      sortOptions={getTableSortOptions(columns)}
      count={items?.length}
      selectedCount={selectedItems?.length}
      unavailableMessage={
        error?.status === 500 ? T.CannotConnectOneKS : undefined
      }
      onSelectAll={(checked) =>
        setSelectedItems(checked ? items?.map(({ ID }) => toId(ID)) : [])
      }
    >
      {(() => {
        switch (containerView) {
          case TABLE_VIEW_MODE.LIST:
            return (
              <Table
                columns={columns}
                data={items}
                isLoading={isRefreshing}
                isRowsSelectable
                isMultiRowSelection
                isCopyColumn
                rowSelection={rowSelection}
                onRowSelectionChange={handleRowSelectionChange}
                getRowId={(row) => toId(row.ID)}
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
                {items?.map((cluster) => (
                  <OneKsResource.Card
                    key={cluster?.ID}
                    data={cluster}
                    isSelected={selectedItems?.includes(toId(cluster?.ID))}
                    onCheck={() =>
                      setSelectedItems(
                        selectedItems?.includes(toId(cluster?.ID))
                          ? selectedItems.filter(
                              (id) => id !== toId(cluster?.ID)
                            )
                          : [...(selectedItems ?? []), toId(cluster?.ID)]
                      )
                    }
                    onClick={() => handleSelect(cluster?.ID)}
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
