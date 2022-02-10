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
import { Actions, Commands } from 'server/utils/constants/commands/host'
import { httpCodes } from 'server/utils/constants'
import { requestConfig, RestClient } from 'client/utils'

export const hostService = {
  /**
   * Retrieves information for the host.
   *
   * @param {object} data - Request parameters
   * @param {string} data.id - Host id
   * @returns {object} Get host identified by id
   * @throws Fails when response isn't code 200
   */
  getHost: async ({ id }) => {
    const name = Actions.HOST_INFO
    const command = { name, ...Commands[name] }
    const config = requestConfig({ id }, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.HOST ?? {}
  },

  /**
   * Retrieves information for all the hosts in the pool.
   *
   * @returns {object} Get list of hosts
   * @throws Fails when response isn't code 200
   */
  getHosts: async () => {
    const name = Actions.HOST_POOL_INFO
    const command = { name, ...Commands[name] }
    const config = requestConfig(undefined, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.HOST_POOL?.HOST ?? []].flat()
  },
  /**
   * Allocates a new host in OpenNebula.
   *
   * @param {object} params - Request params
   * @param {string} params.hostname - Hostname of the machine we want to add
   * @param {string} params.imMad
   * - The name of the information manager (im_mad_name),
   * this values are taken from the oned.conf with the tag name IM_MAD (name)
   * @param {string} params.vmmMad
   * - The name of the virtual machine manager mad name (vmm_mad_name),
   * this values are taken from the oned.conf with the tag name VM_MAD (name)
   * @param {string|number} [params.cluster] - The cluster ID
   * @returns {number} Host id
   * @throws Fails when response isn't code 200
   */
  allocate: async (params) => {
    const name = Actions.HOST_ALLOCATE
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data
  },

  /**
   * Deletes the given host from the pool.
   *
   * @param {object} params - Request params
   * @param {number|string} params.id - Host id
   * @returns {number} Host id
   * @throws Fails when response isn't code 200
   */
  delete: async (params) => {
    const name = Actions.HOST_DELETE
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data
  },

  /**
   * Sets the status of the host to enabled.
   *
   * @param {object} params - Request params
   * @param {number|string} params.id - Host id
   * @returns {number} Host id
   * @throws Fails when response isn't code 200
   */
  enable: async (params) => {
    const name = Actions.HOST_STATUS
    const command = { name, ...Commands[name] }
    const config = requestConfig({ ...params, status: 0 }, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data
  },

  /**
   * Sets the status of the host to disabled.
   *
   * @param {object} params - Request params
   * @param {number|string} params.id - Host id
   * @returns {number} Host id
   * @throws Fails when response isn't code 200
   */
  disable: async (params) => {
    const name = Actions.HOST_STATUS
    const command = { name, ...Commands[name] }
    const config = requestConfig({ ...params, status: 1 }, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data
  },

  /**
   * Sets the status of the host to offline.
   *
   * @param {object} params - Request params
   * @param {number|string} params.id - Host id
   * @returns {number} Host id
   * @throws Fails when response isn't code 200
   */
  offline: async (params) => {
    const name = Actions.HOST_STATUS
    const command = { name, ...Commands[name] }
    const config = requestConfig({ ...params, status: 2 }, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data
  },

  /**
   * Replaces the host’s template contents..
   *
   * @param {object} params - Request params
   * @param {number|string} params.id - Host id
   * @param {string} params.template - The new template contents
   * @param {0|1} params.replace
   * - Update type:
   * ``0``: Replace the whole template.
   * ``1``: Merge new template with the existing one.
   * @returns {number} Host id
   * @throws Fails when response isn't code 200
   */
  update: async (params) => {
    const name = Actions.HOST_UPDATE
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data
  },

  /**
   * Renames a host.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Host id
   * @param {string} params.name - New name
   * @returns {number} Host id
   * @throws Fails when response isn't code 200
   */
  rename: async (params) => {
    const name = Actions.HOST_RENAME
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Returns the host monitoring records.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Host id
   * @returns {string} The monitoring information string / The error string
   * @throws Fails when response isn't code 200
   */
  monitoring: async (params) => {
    const name = Actions.HOST_MONITORING
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Returns all the host monitoring records.
   *
   * @param {object} params - Request parameters
   * @param {string|number} [params.seconds]
   * - Retrieve monitor records in the last num seconds.
   * ``0``: Only the last record.
   * ``-1``: All records.
   * @returns {string} The monitoring information string / The error string
   * @throws Fails when response isn't code 200
   */
  monitoringPool: async (params) => {
    const name = Actions.HOST_POOL_MONITORING
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },
}
