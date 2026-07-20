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
import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createTable, timeFromMilliseconds } from '@UtilsModule'
import { ServiceAPI, VmAPI, oneApi } from '@FeaturesModule'
import { T } from '@ConstantsModule'
import { StatusTag } from '@ComponentsV2Module'
import {
  getRoleVms,
  getServiceState,
  getServiceTotalRoles,
  getServiceTotalVms,
} from '@modules/models/Service/general'
import { createLabelColumn } from '@modules/models/labels'
import {
  VM_COLUMNS,
  VM_SCHED_ACTION_COLUMNS,
} from '@modules/models/VirtualMachine/table'

import { getScheduleActions } from '@modules/models/VirtualMachine/general'

/* eslint-disable jsdoc/require-jsdoc */
export const SERVICES_COLUMNS = [
  { header: T.ID, id: 'id', accessorKey: 'ID', grow: false },
  { header: T.Name, id: 'name', accessorKey: 'NAME', truncate: true },
  {
    header: T.State,
    accessorFn: (service) => getServiceState(service)?.displayName ?? '-',
    cell: ({ row }) => {
      const { color, displayName } = getServiceState(row.original) ?? {}

      return displayName ? (
        <StatusTag statusColor={color} statusName={displayName} />
      ) : (
        '-'
      )
    },
  },
  {
    header: T.Roles,
    id: 'roles',
    accessorFn: getServiceTotalRoles,
  },
  {
    header: T.TotalVms,
    id: 'vms',
    accessorFn: getServiceTotalVms,
  },
  { header: T.Owner, id: 'owner', accessorKey: 'UNAME', grow: false },
  { header: T.Group, id: 'group', accessorKey: 'GNAME', grow: false },
  {
    header: T.StartTime,
    id: 'time',
    accessorFn: ({ TEMPLATE: { BODY = {} } = {} }) => {
      const time = BODY.registration_time ?? BODY.start_time

      return time ? timeFromMilliseconds(+time).toRelative() : '-'
    },
    grow: false,
  },
  createLabelColumn({ grow: false }),
]

const ROLE_SCHED_ACTION_COLUMNS = [
  {
    id: 'ROLE_NAME',
    header: T.Role,
    accessorKey: 'ROLE',
    truncate: true,
  },
  {
    id: 'VM_NAME',
    header: T.VM,
    accessorKey: 'VM_NAME',
    truncate: true,
  },
  ...VM_SCHED_ACTION_COLUMNS,
]

const ROLE_VM_COLUMN_IDS = [
  'id',
  'name',
  'state',
  'hostname',
  'ips',
  'cpu',
  'memory',
  'owner',
  'group',
  'time',
]

export const ROLE_VMS_COLUMNS = [
  {
    header: T.Role,
    id: 'role',
    accessorKey: 'ROLE',
    truncate: true,
  },
  ...VM_COLUMNS.filter(({ id }) => ROLE_VM_COLUMN_IDS.includes(id)),
]

export const serviceTable = createTable(
  SERVICES_COLUMNS,
  ServiceAPI.useGetServicesQuery,
  { dataCy: 'services' }
)

export const rolevmsTable = createTable(
  ROLE_VMS_COLUMNS,
  (args, options) => {
    const { id, role = [] } = args ?? {}
    const shouldSkipService =
      options?.skip || id === undefined || id === null || id === ''

    const {
      data: roleVms = [],
      isFetching: isFetchingService,
      isLoading: isLoadingService,
      refetch: refetchService,
    } = ServiceAPI.useGetServiceQuery(
      { id },
      {
        ...options,
        skip: shouldSkipService,
        selectFromResult: ({ data, isFetching, isLoading }) => ({
          data: getRoleVms(data, role),
          isFetching,
          isLoading,
        }),
      }
    )

    const vmIds = [...new Set(roleVms.map(({ ID }) => ID))].join(',')

    const {
      data: vms = [],
      isFetching: isFetchingVms,
      isLoading: isLoadingVms,
      refetch: refetchVms,
    } = VmAPI.useGetVmInfosetQuery(
      { ids: vmIds, extended: 1 },
      {
        ...options,
        skip: options?.skip || !vmIds,
        selectFromResult: ({ data, isFetching, isLoading }) => {
          const vmsById = new Map(
            []
              .concat(data)
              .filter(Boolean)
              .map((vm = {}) => [String(vm?.ID), vm])
          )

          return {
            data: roleVms
              .map(({ ID, ROLE }) => {
                const vm = vmsById.get(ID)

                return vm && { ...vm, ROLE }
              })
              .filter(Boolean),
            isFetching,
            isLoading,
          }
        },
      }
    )

    return {
      data: vmIds ? vms : [],
      isFetching: isFetchingService || isFetchingVms,
      isLoading: isLoadingService || isLoadingVms,
      refetch: () =>
        Promise.all(
          [!shouldSkipService && refetchService, vmIds && refetchVms]
            .filter(Boolean)
            .map((refetch) => refetch())
        ),
    }
  },
  { dataCy: 'role-vms' }
)

export const roleschedactionsTable = createTable(
  ROLE_SCHED_ACTION_COLUMNS,
  (args, options) => {
    const dispatch = useDispatch()
    const { ids = [], vmContext = {} } = args ?? {}
    const aIds = useMemo(() => [].concat(ids).filter(Boolean), [ids])
    const shouldSkip = options?.skip || !aIds.length

    useEffect(() => {
      if (shouldSkip) return undefined

      const subscriptions = aIds.map((id) =>
        dispatch(
          oneApi.endpoints.getVm.initiate({
            id,
            extended: 1,
          })
        )
      )

      return () => {
        subscriptions.forEach((subscription) => subscription.unsubscribe())
      }
    }, [dispatch, shouldSkip, aIds])

    const results = useSelector((state) =>
      aIds.map((id) =>
        oneApi.endpoints.getVm.select({
          id,
          extended: 1,
        })(state)
      )
    )

    const schedActions = useMemo(
      () =>
        results
          .flatMap(({ data: vm }) =>
            []
              .concat(getScheduleActions(vm) ?? [])
              .filter(Boolean)
              .map((action) => ({
                ...action,
                VM_ID: vm?.ID,
                VM_NAME: vmContext?.[vm?.ID]?.VM_NAME ?? vm?.NAME ?? vm?.ID,
                ROLE: vmContext?.[vm?.ID]?.ROLE,
              }))
          )
          .filter(Boolean),
      [results, vmContext]
    )

    const refetchVms = () => {
      aIds.forEach((id) => {
        dispatch(
          oneApi.endpoints.getVm.initiate(
            {
              id,
              extended: 1,
            },
            { forceRefetch: true }
          )
        )
      })
    }

    return {
      data: schedActions,
      isFetching: results.some(({ isFetching }) => isFetching),
      isLoading: results.some(({ isLoading }) => isLoading),
      refetch: refetchVms,
    }
  },
  { dataCy: 'role-scheduled-actions' }
)
