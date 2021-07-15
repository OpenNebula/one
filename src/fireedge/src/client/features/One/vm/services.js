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

export const vmService = ({
  /**
   * Retrieves information for the virtual machine.
   *
   * @param {object} data - Request parameters
   * @param {string} data.id - User id
   * @returns {object} Get user identified by id
   * @throws Fails when response isn't code 200
   */
  getVm: async ({ id }) => {
    const name = Actions.VM_INFO
    const command = { name, ...Commands[name] }
    const config = requestConfig({ id }, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.VM ?? {}
  },

  /**
   * Retrieves information for all or part of
   * the VMs in the pool.
   *
   * @param {object} data - Request params
   * @param {string} data.filter - Filter flag
   * @param {number} data.start - Range start ID
   * @param {number} data.end - Range end ID
   * @returns {Array} List of VMs
   * @throws Fails when response isn't code 200
   */
  getVms: async ({ filter, start, end }) => {
    const name = Actions.VM_POOL_INFO
    const command = { name, ...Commands[name] }
    const config = requestConfig({ filter, start, end }, command)

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
  actionVm: async ({ id, action }) => {
    const name = Actions.VM_ACTION
    const command = { name, ...Commands[name] }
    const config = requestConfig({ id, action }, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.VM ?? {}
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
  rename: async ({ id, name: newName }) => {
    const name = Actions.VM_RENAME
    const command = { name, ...Commands[name] }
    const config = requestConfig({ id, name: newName }, command)

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
   * Detaches a network interface from a virtual machine.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Virtual machine id
   * @param {string|number} params.nic - NIC id
   * @returns {number} Virtual machine id
   * @throws Fails when response isn't code 200
   */
  detachNic: async ({ id, nic }) => {
    const name = Actions.VM_NIC_DETACH
    const command = { name, ...Commands[name] }
    const config = requestConfig({ id, nic }, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  }
})
