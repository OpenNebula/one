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
import { PROVISION } from 'server/routes/api/provision/string-routes'
import { httpCodes, defaults } from 'server/utils/constants'
import { RestClient } from 'client/utils'

const { POST, PUT, DELETE } = defaults?.httpMethod || {}

export const provisionService = {
  // --------------------------------------------
  // PROVISION TEMPLATE requests
  // --------------------------------------------

  /**
   * Retrieves information for all the
   * provision templates.
   *
   * @returns {Array} List of provision templates
   * @throws Fails when response isn't code 200
   */
  getProvisionsTemplates: async () => {
    const res = await RestClient.request({
      url: `/api/${PROVISION}/defaults`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? []
  },

  /**
   * TODO: Create a provision template.
   *
   * @returns {Promise} TODO
   */
  createProvisionTemplate: () => {
    return Promise.resolve().then((res) => res?.data?.DOCUMENT ?? {})
  },

  // --------------------------------------------
  // PROVISION requests
  // --------------------------------------------

  /**
   * Retrieves information for the provision.
   *
   * @param {object} data - Request parameters
   * @param {string} data.id - Provision id
   * @returns {object} Get provision identified by id
   * @throws Fails when response isn't code 200
   */
  getProvision: async ({ id }) => {
    const res = await RestClient.request({
      url: `/api/${PROVISION}/list/${id}`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.DOCUMENT ?? {}
  },

  /**
   * Retrieves information for all providers.
   *
   * @returns {Array} List of providers
   * @throws Fails when response isn't code 200
   */
  getProvisions: async () => {
    const res = await RestClient.request({
      url: `/api/${PROVISION}/list`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.DOCUMENT_POOL?.DOCUMENT ?? []].flat()
  },

  /**
   * Create a provision.
   *
   * @param {object} params - Request parameters
   * @param {object} params.data - Form data
   * @returns {object} Object of document created
   * @throws Fails when response isn't code 200
   */
  createProvision: async ({ data = {} }) => {
    const res = await RestClient.request({
      data,
      method: POST,
      url: `/api/${PROVISION}/create`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) {
      if (res?.id === httpCodes.accepted.id) return res?.data
      throw res
    }

    return res?.data
  },

  /**
   * Configure the provision hosts.
   *
   * @param {object} params - Request parameters
   * @param {object} params.id - Provision id
   * @returns {object} Object of document updated
   * @throws Fails when response isn't code 200
   */
  configureProvision: async ({ id }) => {
    const res = await RestClient.request({
      method: PUT,
      url: `/api/${PROVISION}/configure/${id}`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) {
      if (res?.id === httpCodes.accepted.id) return res
      throw res
    }

    return res?.data ?? {}
  },

  /**
   * Delete the provision and OpenNebula objects.
   *
   * @param {object} params - Request parameters
   * @param {object} params.id - Provider id
   * @param {object} params.cleanup
   * - If `true`, force to terminate VMs running
   * on provisioned Hosts and delete all images in the datastores
   * @returns {object} Object of document deleted
   * @throws Fails when response isn't code 200
   */
  deleteProvision: async ({ id, ...data }) => {
    const res = await RestClient.request({
      method: DELETE,
      url: `/api/${PROVISION}/delete/${id}`,
      data,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) {
      if (res?.id === httpCodes.accepted.id) return res
      throw res
    }

    return res?.data ?? {}
  },

  /**
   * Retrieves debug log for the provision.
   *
   * @param {object} data - Request parameters
   * @param {string} data.id - Provision id
   * @returns {object} Get provision log identified by id
   * @throws Fails when response isn't code 200
   */
  getProvisionLog: async ({ id }) => {
    const res = await RestClient.request({
      url: `/api/${PROVISION}/log/${id}`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) {
      if (res?.id === httpCodes.accepted.id) return res
      throw res
    }

    return res?.data ?? {}
  },

  // --------------------------------------------
  // INFRASTRUCTURE requests
  // --------------------------------------------

  /**
   * Delete the datastore from the provision.
   *
   * @param {object} params - Request parameters
   * @param {object} params.id - Datastore id
   * @returns {object} Object of document deleted
   * @throws Fails when response isn't code 200
   */
  deleteDatastore: async ({ id }) => {
    const res = await RestClient.request({
      method: DELETE,
      url: `/api/${PROVISION}/datastore/${id}`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  },

  /**
   * Delete the virtual network from the provision.
   *
   * @param {object} params - Request parameters
   * @param {object} params.id - Virtual network id
   * @returns {object} Object of document deleted
   * @throws Fails when response isn't code 200
   */
  deleteVNetwork: async ({ id }) => {
    const res = await RestClient.request({
      method: DELETE,
      url: `/api/${PROVISION}/network/${id}`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  },

  /**
   * Delete the host from the provision.
   *
   * @param {object} params - Request parameters
   * @param {object} params.id - Host id
   * @returns {object} Object of document deleted
   * @throws Fails when response isn't code 200
   */
  deleteHost: async ({ id }) => {
    const res = await RestClient.request({
      method: DELETE,
      url: `/api/${PROVISION}/host/${id}`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  },

  /**
   * Configure the provision host.
   *
   * @param {object} params - Request parameters
   * @param {object} params.id - Host id
   * @returns {object} Object of document updated
   * @throws Fails when response isn't code 200
   */
  configureHost: async ({ id }) => {
    const res = await RestClient.request({
      method: PUT,
      url: `/api/${PROVISION}/host/${id}`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) {
      if (res?.id === httpCodes.accepted.id) return res
      throw res
    }

    return res?.data ?? {}
  },
}
