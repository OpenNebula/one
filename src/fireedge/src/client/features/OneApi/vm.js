/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { Actions, Commands } from 'server/utils/constants/commands/vm'
import {
  Actions as ExtraActions,
  Commands as ExtraCommands,
} from 'server/routes/api/vm/routes'

import {
  Actions as ExtraActionsPool,
  Commands as ExtraCommandsPool,
} from 'server/routes/api/vmpool/routes'

import {
  oneApi,
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
} from 'client/features/OneApi'
import {
  updateResourceOnPool,
  removeResourceOnPool,
  updateNameOnResource,
  updateLockLevelOnResource,
  removeLockLevelOnResource,
  updatePermissionOnResource,
  updateOwnershipOnResource,
  updateTemplateOnResource,
} from 'client/features/OneApi/common'
import { actions as guacamoleActions } from 'client/features/Guacamole/slice'
import { UpdateFromSocket } from 'client/features/OneApi/socket'
import http from 'client/utils/rest'
import {
  LockLevel,
  FilterFlag,
  Permission,
  VM as VmType,
} from 'client/constants'

const { VM } = ONE_RESOURCES
const { VM_POOL } = ONE_RESOURCES_POOL

const vmApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getVms: builder.query({
      /**
       * Retrieves information for all or part of
       * the VMs in the pool.
       *
       * @param {object} params - Request parameters
       * @param {boolean} params.extended - Retrieves information for all or part
       * @param {FilterFlag} [params.filter] - Filter flag
       * @param {number} [params.start] - Range start ID
       * @param {number} [params.end] - Range end ID
       * @param {number} [params.state] - VM state to filter by
       * - `-2`: Any state, including DONE
       * - `-1`: Any state, except DONE
       * - `0`:  INIT
       * - `1`:  PENDING
       * - `2`:  HOLD
       * - `3`:  ACTIVE
       * - `4`:  STOPPED
       * - `5`:  SUSPENDED
       * - `6`:  DONE
       * - `8`:  POWEROFF
       * - `9`:  UNDEPLOYED
       * - `10`: CLONING
       * - `11`: CLONING_FAILURE
       * @param {string} [params.filterByKey] - Filter in KEY=VALUE format
       * @returns {VmType[]} List of VMs
       * @throws Fails when response isn't code 200
       */
      query: ({ extended = true, ...params } = {}) => {
        const name = extended
          ? Actions.VM_POOL_INFO_EXTENDED
          : Actions.VM_POOL_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => [data?.VM_POOL?.VM ?? []].flat(),
      providesTags: (vms) =>
        vms
          ? [...vms.map(({ ID }) => ({ type: VM_POOL, id: `${ID}` })), VM_POOL]
          : [VM_POOL],
    }),
    getVm: builder.query({
      /**
       * Retrieves information for the virtual machine.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - VM id
       * @returns {VmType} Get VM identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => data?.VM ?? {},
      providesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: resourceFromQuery } = await queryFulfilled

          dispatch(
            vmApi.util.updateQueryData(
              'getVms',
              undefined,
              updateResourceOnPool({ id, resourceFromQuery })
            )
          )
        } catch {
          // if the query fails, we want to remove the resource from the pool
          dispatch(
            vmApi.util.updateQueryData(
              'getVms',
              undefined,
              removeResourceOnPool({ id })
            )
          )
        }
      },
      onCacheEntryAdded: UpdateFromSocket({
        updateQueryData: (updateFn) =>
          vmApi.util.updateQueryData('getVms', undefined, updateFn),
        resource: 'VM',
      }),
    }),
    getGuacamoleSession: builder.query({
      /**
       * Returns a Guacamole session.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @param {'vnc'|'ssh'|'rdp'} params.type - Connection type
       * @returns {string} The session token
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = ExtraActions.GUACAMOLE
        const command = { name, ...ExtraCommands[name] }

        return { params, command }
      },
      async onQueryStarted({ id, type }, { dispatch, queryFulfilled }) {
        try {
          const { data: token } = await queryFulfilled
          dispatch(guacamoleActions.addGuacamoleSession({ id, type, token }))
        } catch {}
      },
    }),
    getMonitoring: builder.query({
      /**
       * Returns the virtual machine monitoring records.
       *
       * @param {string|number} id - Virtual machine id
       * @returns {string} The monitoring information
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.VM_MONITORING
        const command = { name, ...Commands[name] }

        return { params: { id }, command }
      },
      transformResponse: (data) =>
        [data?.MONITORING_DATA?.MONITORING ?? []].flat(),
    }),
    getMonitoringPool: builder.query({
      /**
       * Returns all the virtual machine monitoring records.
       *
       * @param {object} params - Request parameters
       * @param {FilterFlag} params.filter - Filter flag
       * @param {number|'0'|'-1'} [params.seconds]
       * - Retrieve monitor records in the last num seconds
       * - `0`: Only the last record.
       * - `-1`: All records.
       * @returns {string} The monitoring information
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_POOL_MONITORING
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
    getAccountingPool: builder.query({
      /**
       * Returns the virtual machine history records.
       *
       * @param {object} params - Request parameters
       * @param {FilterFlag} [params.filter] - Filter flag
       * @param {number} [params.start] - Range start ID
       * @param {number} [params.end] - Range end ID
       * @returns {string} The information string
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_POOL_ACCOUNTING
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
    getAccountingPoolFiltered: builder.query({
      /**
       * Returns the virtual machine history records filtered by user or group.
       *
       * @param {object} params - Request parameters
       * @param {number} [params.user] - User id
       * @param {number} [params.group] - Group id
       * @param {number} [params.start] - Range start date
       * @param {number} [params.end] - Range end date
       * @returns {string} The information string
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = ExtraActionsPool.VM_POOL_ACCOUNTING_FILTER
        const command = { name, ...ExtraCommandsPool[name] }

        return { params, command }
      },
    }),
    getShowbackPool: builder.query({
      /**
       * Returns the virtual machine showback records.
       *
       * @param {object} params - Request parameters
       * @param {FilterFlag} [params.filter] - Filter flag
       * @param {number} [params.startMonth] - First month for the time interval
       * @param {number} [params.startYear] - First year for the time interval
       * @param {number} [params.endMonth] - Last month for the time interval
       * @param {number} [params.endYear] - Last year for the time interval
       * @returns {string} The information string
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_POOL_SHOWBACK
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
    getShowbackPoolFiltered: builder.query({
      /**
       * Returns the virtual machine showback records filtered by user or group.
       *
       * @param {object} params - Request parameters
       * @param {number} [params.user] - User id
       * @param {number} [params.group] - Group id
       * @param {number} [params.startMonth] - First month for the time interval
       * @param {number} [params.startYear] - First year for the time interval
       * @param {number} [params.endMonth] - Last month for the time interval
       * @param {number} [params.endYear] - Last year for the time interval
       * @returns {string} The information string
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = ExtraActionsPool.VM_POOL_SHOWBACK_FILTER
        const command = { name, ...ExtraCommandsPool[name] }

        return { params, command }
      },
    }),
    calculateShowback: builder.query({
      /**
       * Processes all the history records, and stores the monthly cost for each VM.
       *
       * @param {object} params - Request parameters
       * @param {number} [params.startMonth] - First month for the time interval
       * @param {number} [params.startYear] - First year for the time interval
       * @param {number} [params.endMonth] - Last month for the time interval
       * @param {number} [params.endYear] - Last year for the time interval
       * @returns {''} Empty
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_POOL_CALCULATE_SHOWBACK
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
    allocateVm: builder.mutation({
      /**
       * Allocates a new virtual machine in OpenNebula.
       *
       * @param {object} params - Request params
       * @param {string} params.template - A string containing the template of the VM on syntax XML
       * @param {boolean} [params.status] - False to create the VM on pending (default), True to create it on hold.
       * @returns {number} VM id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_ALLOCATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
    saveAsTemplate: builder.mutation({
      /**
       * Clones the VM's source Template, replacing the disks with live snapshots
       * of the current disks. The VM capacity and NICs are also preserved.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Virtual machine id
       * @param {string} params.name - Template name
       * @param {boolean} params.persistent - Make the new images persistent
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      queryFn: async ({ id, name, persistent }) => {
        try {
          const response = await http.request({
            url: `/api/vm/save/${id}`,
            method: 'POST',
            data: { name, persistent },
          })

          return { data: response.data }
        } catch (axiosError) {
          const { response } = axiosError

          return { error: { status: response?.status, data: response?.data } }
        }
      },
    }),
    deploy: builder.mutation({
      /**
       * Initiates the instance of the given VM id on the target host.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Virtual machine id
       * @param {string|number} params.host - The target host id
       * @param {boolean} [params.enforce] - If `true`, will enforce the Host capacity isn't over committed.
       * @param {string|number} [params.datastore] - The target datastore id.
       * It is optional, and can be set to -1 to let OpenNebula choose the datastore
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_DEPLOY
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
        VM_POOL,
      ],
    }),
    actionVm: builder.mutation({
      /**
       * Submits an action to be performed on a virtual machine.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @param {(
       * 'terminate-hard'|'terminate'|'undeploy-hard'|'undeploy'|
       * 'poweroff-hard'|'poweroff'|'reboot-hard'|'reboot'|
       * 'hold'|'release'|'stop'|'suspend'|'resume'|'resched'|'unresched'
       * )} params.action - The action name to be performed
       * @returns {Response} Response
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_ACTION
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
        VM_POOL,
      ],
    }),
    migrate: builder.mutation({
      /**
       * Migrates one virtual machine to the target host.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Virtual machine id
       * @param {string|number} params.host - The target host id
       * @param {boolean} [params.live]
       * - If `true` we are indicating that we want live migration, otherwise `false`.
       * @param {boolean} params.enforce
       * - If `true`, will enforce the Host capacity isn't over committed.
       * @param {string|number} params.datastore - The target datastore id.
       * It is optional, and can be set to -1 to let OpenNebula choose the datastore
       * @param {0|1|2} params.type - Migration type: save (0), poweroff (1), poweroff-hard (2)
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_MIGRATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
        VM_POOL,
      ],
    }),
    saveAsDisk: builder.mutation({
      /**
       * Sets the disk to be saved in the given image.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Virtual machine id
       * @param {string|number} params.disk - Disk id
       * @param {string} params.name - Name for the new Image
       * @param {string} [params.type] - Type for the new Image.
       * If it is an empty string, then the default one will be used
       * @param {string|number} params.snapshot - Id of the snapshot to export.
       * If -1 the current image state will be used.
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_DISK_SAVEAS
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    createDiskSnapshot: builder.mutation({
      /**
       * Takes a new snapshot of the disk image.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Virtual machine id
       * @param {string|number} params.disk - Disk id
       * @param {string} params.name - Name for the snapshot
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_DISK_SNAP_CREATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    deleteDiskSnapshot: builder.mutation({
      /**
       * Deletes a disk snapshot.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Virtual machine id
       * @param {string|number} params.disk - Disk id
       * @param {string|number} params.snapshot - Snapshot id
       * @returns {number} The id of the snapshot deleted
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_DISK_SNAP_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    revertDiskSnapshot: builder.mutation({
      /**
       * Reverts disk state to a previously taken snapshot.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Virtual machine id
       * @param {string|number} params.disk - Disk id
       * @param {string|number} params.snapshot - Snapshot id
       * @returns {number} The snapshot id used
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_DISK_SNAP_REVERT
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    renameDiskSnapshot: builder.mutation({
      /**
       * Renames a disk snapshot.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Virtual machine id
       * @param {string|number} params.disk - Disk id
       * @param {string|number} params.snapshot - Snapshot id
       * @param {string} params.name - New snapshot name
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_DISK_SNAP_RENAME
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    attachDisk: builder.mutation({
      /**
       * Attaches a new disk to the virtual machine.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Virtual machine id
       * @param {string} params.template
       * - A string containing a single DISK vector attribute
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_DISK_ATTACH
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    detachDisk: builder.mutation({
      /**
       * Detaches a disk from a virtual machine.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Virtual machine id
       * @param {string|number} params.disk - Disk id
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_DISK_DETACH
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    resizeDisk: builder.mutation({
      /**
       * Resizes a disk of a virtual machine.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Virtual machine id
       * @param {string|number} params.disk - Disk id
       * @param {string} params.size - The new size string
       * - Options to perform action
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_DISK_RESIZE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    attachNic: builder.mutation({
      /**
       * Attaches a new network interface to the virtual machine.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Virtual machine id
       * @param {string} params.template
       * - A string containing a single NIC vector attribute
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_NIC_ATTACH
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    detachNic: builder.mutation({
      /**
       * Detaches a network interface from a virtual machine.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @param {string} params.nic - NIC id
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_NIC_DETACH
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    updateNic: builder.mutation({
      /**
       * Updates a network interface from a virtual machine.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @param {string} params.nic - NIC id
       * @param {number} params.append - Append
       * @param {string} params.template - NIC id
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_NIC_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    attachSecurityGroup: builder.mutation({
      /**
       * Attaches a security group to a network interface of a VM,
       * if the VM is running it updates the associated rules.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @param {string} params.nic - The NIC ID
       * @param {string} params.secgroup - The Security Group ID, which should be added to the NIC
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_SEC_GROUP_ATTACH
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    detachSecurityGroup: builder.mutation({
      /**
       * Detaches a security group from a network interface of a VM,
       * if the VM is running it removes the associated rules.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @param {string} params.nic - The NIC ID
       * @param {string} params.secgroup - The Security Group ID
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_SEC_GROUP_DETACH
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    changeVmPermissions: builder.mutation({
      /**
       * Changes the permission bits of a virtual machine.
       * If set any permission to -1, it's not changed.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @param {Permission|'-1'} params.ownerUse - User use
       * @param {Permission|'-1'} params.ownerManage - User manage
       * @param {Permission|'-1'} params.ownerAdmin - User administrator
       * @param {Permission|'-1'} params.groupUse - Group use
       * @param {Permission|'-1'} params.groupManage - Group manage
       * @param {Permission|'-1'} params.groupAdmin - Group administrator
       * @param {Permission|'-1'} params.otherUse - Other use
       * @param {Permission|'-1'} params.otherManage - Other manage
       * @param {Permission|'-1'} params.otherAdmin - Other administrator
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_CHMOD
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVm = dispatch(
            vmApi.util.updateQueryData(
              'getVm',
              { id: params.id },
              updatePermissionOnResource(params)
            )
          )

          queryFulfilled.catch(patchVm.undo)
        } catch {}
      },
    }),
    changeVmOwnership: builder.mutation({
      /**
       * Changes the ownership bits of a virtual machine.
       * If set to `-1`, the user or group aren't changed.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @param {number} params.user - The user id
       * @param {number} params.group - The group id
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_CHOWN
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
      async onQueryStarted(params, { getState, dispatch, queryFulfilled }) {
        try {
          const patchVm = dispatch(
            vmApi.util.updateQueryData(
              'getVm',
              { id: params.id },
              updateOwnershipOnResource(getState(), params)
            )
          )

          queryFulfilled.catch(patchVm.undo)
        } catch {}
      },
    }),
    renameVm: builder.mutation({
      /**
       * Renames a virtual machine.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @param {string} params.name - The new name
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_RENAME
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVm = dispatch(
            vmApi.util.updateQueryData(
              'getVm',
              { id: params.id },
              updateNameOnResource(params)
            )
          )

          const patchVms = dispatch(
            vmApi.util.updateQueryData(
              'getVms',
              undefined,
              updateNameOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVm.undo()
            patchVms.undo()
          })
        } catch {}
      },
    }),
    createVmSnapshot: builder.mutation({
      /**
       * Creates a new virtual machine snapshot.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @param {string} params.name - The new snapshot name
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_SNAP_CREATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    revertVmSnapshot: builder.mutation({
      /**
       * Reverts a virtual machine to a snapshot.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @param {string} params.snapshot - The snapshot id
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_SNAP_REVERT
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    deleteVmSnapshot: builder.mutation({
      /**
       * Deletes a virtual machine snapshot.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @param {string} params.snapshot - The snapshot id
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_SNAP_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    resize: builder.mutation({
      /**
       * Changes the capacity of the virtual machine.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @param {string} params.template - Template containing the new capacity
       * @param {boolean} params.enforce - `true` to enforce the Host capacity isn't over committed
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_RESIZE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    updateUserTemplate: builder.mutation({
      /**
       * Replaces the user template contents.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @param {string} params.template - The new user template contents on syntax XML
       * @param {0|1} params.replace
       * - Update type:
       * ``0``: Replace the whole template.
       * ``1``: Merge new template with the existing one.
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVm = dispatch(
            vmApi.util.updateQueryData(
              'getVm',
              { id: params.id },
              updateTemplateOnResource(params, 'USER_TEMPLATE')
            )
          )

          const patchVms = dispatch(
            vmApi.util.updateQueryData(
              'getVms',
              undefined,
              updateTemplateOnResource(params, 'USER_TEMPLATE')
            )
          )

          queryFulfilled.catch(() => {
            patchVm.undo()
            patchVms.undo()
          })
        } catch {}
      },
    }),
    updateConfiguration: builder.mutation({
      /**
       * Updates (appends) a set of supported configuration attributes in the VM template.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @param {string} params.template - The new configuration contents on syntax XML
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_CONF_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    recover: builder.mutation({
      /**
       * Recovers a stuck VM that is waiting for a driver operation.
       * The recovery may be done by failing or succeeding the pending operation.
       *
       * You need to manually check the vm status on the host, to decide
       * if the operation was successful or not.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @param {0|1|2|3|4} params.operation - Recover operation:
       * failure (0), success (1), retry (2), delete (3), delete-recreate (4)
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_RECOVER
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    backup: builder.mutation({
      /**
       * Backup the VM.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @param {number} params.dsId - Backup Datastore id
       * @param {boolean} params.reset - Backup reset
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_BACKUP
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    restore: builder.mutation({
      /**
       * Restore the VM.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @param {number} params.imageId - Image backup id
       * @param {boolean} params.incrementId - Backup increment ID
       * @param {number} params.diskId - Individual disk id
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_RESTORE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    lockVm: builder.mutation({
      /**
       * Locks a Virtual Machine. Lock certain actions depending on blocking level.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @param {LockLevel} params.level - Lock level
       * @param {boolean} params.test - Checks if the object is already locked to return an error
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_LOCK
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVm = dispatch(
            vmApi.util.updateQueryData(
              'getVm',
              { id: params.id },
              updateLockLevelOnResource(params)
            )
          )

          const patchVms = dispatch(
            vmApi.util.updateQueryData(
              'getVms',
              undefined,
              updateLockLevelOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVm.undo()
            patchVms.undo()
          })
        } catch {}
      },
    }),
    unlockVm: builder.mutation({
      /**
       * Unlocks a Virtual Machine.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_UNLOCK
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVm = dispatch(
            vmApi.util.updateQueryData(
              'getVm',
              { id: params.id },
              removeLockLevelOnResource(params)
            )
          )

          const patchVms = dispatch(
            vmApi.util.updateQueryData(
              'getVms',
              undefined,
              removeLockLevelOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVm.undo()
            patchVms.undo()
          })
        } catch {}
      },
    }),
    addScheduledAction: builder.mutation({
      /**
       * Add scheduled action to VM.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Virtual machine id
       * @param {string} params.template - Template containing the new scheduled action
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_SCHED_ADD
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    updateScheduledAction: builder.mutation({
      /**
       * Update scheduled VM action.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Virtual machine id
       * @param {string} params.schedId - The ID of the scheduled action
       * @param {string} params.template - Template containing the updated scheduled action
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_SCHED_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    deleteScheduledAction: builder.mutation({
      /**
       * Delete scheduled action from VM.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Virtual machine id
       * @param {string} params.schedId - The ID of the scheduled action
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_SCHED_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    attachPci: builder.mutation({
      /**
       * Attaches a new PCI device to the virtual machine.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Virtual machine id
       * @param {string} params.template
       * - A string containing a single NIC vector attribute
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_PCI_ATTACH
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
    detachPci: builder.mutation({
      /**
       * Detaches a PCI device from a virtual machine.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @param {string} params.nic - NIC id
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_PCI_DETACH
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VM, id },
        { type: VM_POOL, id },
      ],
    }),
  }),
})

export const {
  // Queries
  useGetVmsQuery,
  useLazyGetVmsQuery,
  useGetVmQuery,
  useLazyGetVmQuery,
  useGetGuacamoleSessionQuery,
  useLazyGetGuacamoleSessionQuery,
  useGetMonitoringQuery,
  useLazyGetMonitoringQuery,
  useGetMonitoringPoolQuery,
  useLazyGetMonitoringPoolQuery,
  useGetAccountingPoolQuery,
  useLazyGetAccountingPoolQuery,
  useGetAccountingPoolFilteredQuery,
  useLazyGetAccountingPoolFilteredQuery,
  useGetShowbackPoolQuery,
  useLazyGetShowbackPoolQuery,
  useGetShowbackPoolFilteredQuery,
  useLazyGetShowbackPoolFilteredQuery,
  useCalculateShowbackQuery,
  useLazyCalculateShowbackQuery,

  // Mutations
  useAllocateVmMutation,
  useSaveAsTemplateMutation,
  useDeployMutation,
  useActionVmMutation,
  useMigrateMutation,
  useSaveAsDiskMutation,
  useCreateDiskSnapshotMutation,
  useDeleteDiskSnapshotMutation,
  useRevertDiskSnapshotMutation,
  useRenameDiskSnapshotMutation,
  useAttachDiskMutation,
  useDetachDiskMutation,
  useResizeDiskMutation,
  useAttachNicMutation,
  useDetachNicMutation,
  useUpdateNicMutation,
  useAttachSecurityGroupMutation,
  useDetachSecurityGroupMutation,
  useChangeVmPermissionsMutation,
  useChangeVmOwnershipMutation,
  useRenameVmMutation,
  useCreateVmSnapshotMutation,
  useRevertVmSnapshotMutation,
  useDeleteVmSnapshotMutation,
  useResizeMutation,
  useUpdateUserTemplateMutation,
  useUpdateConfigurationMutation,
  useRecoverMutation,
  useBackupMutation,
  useRestoreMutation,
  useLockVmMutation,
  useUnlockVmMutation,
  useAddScheduledActionMutation,
  useUpdateScheduledActionMutation,
  useDeleteScheduledActionMutation,
  useAttachPciMutation,
  useDetachPciMutation,
} = vmApi

export default vmApi
