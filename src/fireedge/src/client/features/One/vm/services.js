/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { httpCodes } from 'server/utils/constants'
import { requestConfig, RestClient } from 'client/utils'

export const vmService = {
  /**
   * Retrieves information for the virtual machine.
   *
   * @param {object} params - Request parameters
   * @param {string} params.id - User id
   * @returns {object} Get user identified by id
   * @throws Fails when response isn't code 200
   */
  getVm: async (params) => {
    const name = Actions.VM_INFO
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.VM ?? {}
  },

  /**
   * Retrieves information for all or part of
   * the VMs in the pool.
   *
   * @param {object} params - Request parameters
   * @param {string} params.filter - Filter flag
   * @param {number} params.start - Range start ID
   * @param {number} params.end - Range end ID
   * @param {string|number} params.state - Filter state
   * @returns {Array} List of VMs
   * @throws Fails when response isn't code 200
   */
  getVms: async (params) => {
    const name = Actions.VM_POOL_INFO
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.VM_POOL?.VM ?? []].flat()
  },

  /**
   * Submits an action to be performed on a virtual machine.
   *
   * @param {object} params - Request parameters
   * @param {string} params.id - Virtual machine id
   * @param {(
   * 'terminate-hard'|
   * 'terminate'|
   * 'undeploy-hard'|
   * 'undeploy'|
   * 'poweroff-hard'|
   * 'poweroff'|
   * 'reboot-hard'|
   * 'reboot'|
   * 'hold'|
   * 'release'|
   * 'stop'|
   * 'suspend'|
   * 'resume'|
   * 'resched'|
   * 'unresched'
   * )} params.action - The action name to be performed
   * @returns {Response} Response
   * @throws Fails when response isn't code 200
   */
  actionVm: async (params) => {
    const name = Actions.VM_ACTION
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.VM ?? {}
  },

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
  saveAsTemplate: async ({ id, name, persistent }) => {
    const res = await RestClient.request({
      url: `/api/vm/save/${id}`,
      method: 'POST',
      data: { name, persistent },
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Renames a virtual machine.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Virtual machine id
   * @param {string} params.name - New name
   * @returns {number} Virtual machine id
   * @throws Fails when response isn't code 200
   */
  rename: async (params) => {
    const name = Actions.VM_RENAME
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Changes the capacity of the virtual machine.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Virtual machine id
   * @param {string} params.template - Template containing the new capacity
   * @param {boolean} params.enforce
   * - `true` to enforce the Host capacity isn't over committed.
   * @returns {number} Virtual machine id
   * @throws Fails when response isn't code 200
   */
  resize: async (params) => {
    const name = Actions.VM_RESIZE
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Replaces the user template contents.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Virtual machine id
   * @param {string} params.template - The new user template contents
   * @param {0|1} params.replace
   * - Update type:
   * ``0``: Replace the whole template.
   * ``1``: Merge new template with the existing one.
   * @returns {number} Virtual machine id
   * @throws Fails when response isn't code 200
   */
  updateUserTemplate: async (params) => {
    const name = Actions.VM_UPDATE
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Changes the permission bits of a virtual machine.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Virtual machine id
   * @param {{
   * ownerUse: number,
   * ownerManage: number,
   * ownerAdmin: number,
   * groupUse: number,
   * groupManage: number,
   * groupAdmin: number,
   * otherUse: number,
   * otherManage: number,
   * otherAdmin: number
   * }} params.permissions - Permissions data
   * @returns {number} Virtual machine id
   * @throws Fails when response isn't code 200
   */
  changePermissions: async ({ id, permissions }) => {
    const name = Actions.VM_CHMOD
    const command = { name, ...Commands[name] }
    const config = requestConfig({ id, ...permissions }, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Changes the ownership bits of a virtual machine.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Virtual machine id
   * @param {{user: number, group: number}} params.ownership - Ownership data
   * @returns {number} Virtual machine id
   * @throws Fails when response isn't code 200
   */
  changeOwnership: async ({ id, ownership }) => {
    const name = Actions.VM_CHOWN
    const command = { name, ...Commands[name] }
    const config = requestConfig({ id, ...ownership }, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

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
  attachDisk: async (params) => {
    const name = Actions.VM_DISK_ATTACH
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Detaches a disk from a virtual machine.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Virtual machine id
   * @param {string|number} params.disk - Disk id
   * @returns {number} Virtual machine id
   * @throws Fails when response isn't code 200
   */
  detachDisk: async (params) => {
    const name = Actions.VM_DISK_DETACH
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Sets the disk to be saved in the given image.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Virtual machine id
   * @param {string|number} params.disk - Disk id
   * @param {string} params.name - Name for the new Image
   * @param {string} params.type - Type for the new Image.
   * If it is an empty string, then the default one will be used
   * @param {string|number} params.snapshot - Id of the snapshot to export.
   * If -1 the current image state will be used.
   * @returns {number} Virtual machine id
   * @throws Fails when response isn't code 200
   */
  saveAsDisk: async (params) => {
    const name = Actions.VM_DISK_SAVEAS
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

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
  resizeDisk: async (params) => {
    const name = Actions.VM_DISK_RESIZE
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Takes a new snapshot of the disk image.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Virtual machine id
   * @param {string|number} params.disk - Disk id
   * @param {string} params.description - Description for the snapshot
   * @returns {number} Virtual machine id
   * @throws Fails when response isn't code 200
   */
  createDiskSnapshot: async (params) => {
    const name = Actions.VM_DISK_SNAP_CREATE
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

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
  renameDiskSnapshot: async (params) => {
    const name = Actions.VM_DISK_SNAP_RENAME
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

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
  revertDiskSnapshot: async (params) => {
    const name = Actions.VM_DISK_SNAP_REVERT
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

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
  deleteDiskSnapshot: async (params) => {
    const name = Actions.VM_DISK_SNAP_DELETE
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

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
  attachNic: async (params) => {
    const name = Actions.VM_NIC_ATTACH
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Detaches a network interface from a virtual machine.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Virtual machine id
   * @param {string|number} params.nic - NIC id
   * @returns {number} Virtual machine id
   * @throws Fails when response isn't code 200
   */
  detachNic: async (params) => {
    const name = Actions.VM_NIC_DETACH
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Creates a new virtual machine snapshot.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Virtual machine id
   * @param {string} params.name - The new snapshot name
   * @returns {number} Virtual machine id
   * @throws Fails when response isn't code 200
   */
  createSnapshot: async (params) => {
    const name = Actions.VM_SNAP_CREATE
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Reverts a virtual machine to a snapshot.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Virtual machine id
   * @param {string|number} params.snapshot - The snapshot id
   * @returns {number} Virtual machine id
   * @throws Fails when response isn't code 200
   */
  revertSnapshot: async (params) => {
    const name = Actions.VM_SNAP_REVERT
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Deletes a virtual machine snapshot.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Virtual machine id
   * @param {string|number} params.snapshot - The snapshot id
   * @returns {number} Virtual machine id
   * @throws Fails when response isn't code 200
   */
  deleteSnapshot: async (params) => {
    const name = Actions.VM_SNAP_DELETE
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Add scheduled action to VM.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Virtual machine id
   * @param {string} params.template - Template containing the new scheduled action
   * @returns {number} Virtual machine id
   * @throws Fails when response isn't code 200
   */
  addScheduledAction: async (params) => {
    const name = Actions.VM_SCHED_ADD
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Update scheduled VM action.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Virtual machine id
   * @param {string} params.id_sched - The ID of the scheduled action
   * @param {string} params.template - Template containing the updated scheduled action
   * @returns {number} Virtual machine id
   * @throws Fails when response isn't code 200
   */
  updateScheduledAction: async (params) => {
    const name = Actions.VM_SCHED_UPDATE
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Delete scheduled action from VM.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Virtual machine id
   * @param {string} params.id_sched - The ID of the scheduled action
   * @returns {number} Virtual machine id
   * @throws Fails when response isn't code 200
   */
  deleteScheduledAction: async (params) => {
    const name = Actions.VM_SCHED_DELETE
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Recovers a stuck VM that is waiting for a driver operation.
   * The recovery may be done by failing or succeeding the pending operation.
   *
   * You need to manually check the vm status on the host, to decide
   * if the operation was successful or not.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Virtual machine id
   * @param {0|1|2|3|4} params.operation - Recover operation:
   * success (1), failure (0), retry (2), delete (3), delete-recreate (4)
   * @returns {number} Virtual machine id
   * @throws Fails when response isn't code 200
   */
  recover: async (params) => {
    const name = Actions.VM_RECOVER
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Locks a virtual machine. Lock certain actions depending on blocking level.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Virtual machine id
   * @param {1|2|3|4} params.level
   * - Lock level:
   * ``1``: Use
   * ``2``: Manage
   * ``3``: Admin
   * ``4``: All
   * @param {boolean} params.test - Check if the object is already locked to return an error
   * @returns {number} Virtual machine id
   * @throws Fails when response isn't code 200
   */
  lock: async (params) => {
    const name = Actions.VM_LOCK
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Unlocks a virtual machine.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Virtual machine id
   * @returns {number} Virtual machine id
   * @throws Fails when response isn't code 200
   */
  unlock: async (params) => {
    const name = Actions.VM_UNLOCK
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Initiates the instance of the given VM id on the target host.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Virtual machine id
   * @param {string|number} params.host - The target host id
   * @param {boolean} params.enforce
   * - If `true`, will enforce the Host capacity isn't over committed.
   * @param {string|number} params.datastore - The target datastore id.
   * It is optional, and can be set to -1 to let OpenNebula choose the datastore
   * @returns {number} Virtual machine id
   * @throws Fails when response isn't code 200
   */
  deploy: async (params) => {
    const name = Actions.VM_DEPLOY
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Migrates one virtual machine to the target host.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Virtual machine id
   * @param {string|number} params.host - The target host id
   * @param {boolean} params.live
   * - If `true` we are indicating that we want live migration, otherwise `false`.
   * @param {boolean} params.enforce
   * - If `true`, will enforce the Host capacity isn't over committed.
   * @param {string|number} params.datastore - The target datastore id.
   * It is optional, and can be set to -1 to let OpenNebula choose the datastore
   * @param {0|1|2} params.type - Migration type: save (0), poweroff (1), poweroff-hard (2)
   * @returns {number} Virtual machine id
   * @throws Fails when response isn't code 200
   */
  migrate: async (params) => {
    const name = Actions.VM_MIGRATE
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },
}
