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
import { Actions, Commands } from 'server/utils/constants/commands/template'
import { httpCodes } from 'server/utils/constants'
import { requestConfig, RestClient } from 'client/utils'

export const vmTemplateService = {
  /**
   * Retrieves information for the vm template.
   *
   * @param {object} params - Request parameters
   * @param {string} params.id - Template id
   * @param {boolean} params.extended - True to include extended information
   * @param {boolean} params.decrypt - True to decrypt contained secrets (only admin)
   * @returns {object} Get template identified by id
   * @throws Fails when response isn't code 200
   */
  getVmTemplate: async (params) => {
    const name = Actions.TEMPLATE_INFO
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.VMTEMPLATE ?? {}
  },

  /**
   * Retrieves information for all or part of
   * the virtual machine templates in the pool.
   *
   * @param {object} params - Request params
   * @param {string} params.filter - Filter flag
   * @param {number} params.start - Range start ID
   * @param {number} params.end - Range end ID
   * @returns {Array} List of VM templates
   * @throws Fails when response isn't code 200
   */
  getVmTemplates: async (params) => {
    const name = Actions.TEMPLATE_POOL_INFO
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.VMTEMPLATE_POOL?.VMTEMPLATE ?? []].flat()
  },

  /**
   * Allocates a new template in OpenNebula.
   *
   * @param {object} params - Request params
   * @param {string} params.template - A string containing the template contents
   * @returns {number} Template id
   * @throws Fails when response isn't code 200
   */
  allocate: async (params) => {
    const name = Actions.TEMPLATE_ALLOCATE
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data
  },

  /**
   * Clones an existing virtual machine template.
   *
   * @param {object} params - Request params
   * @param {number|string} params.id - The ID of the template to be cloned
   * @param {string} params.name - Name for the new template
   * @param {boolean} params.image
   * - `true` to clone the template plus any image defined in DISK.
   * The new IMAGE_ID is set into each DISK
   * @returns {number} Template id
   * @throws Fails when response isn't code 200
   */
  clone: async (params) => {
    const name = Actions.TEMPLATE_CLONE
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data
  },

  /**
   * Deletes the given template from the pool.
   *
   * @param {object} params - Request params
   * @param {number|string} params.id - Template id
   * @param {boolean} params.image
   * - `true` to delete the template plus any image defined in DISK
   * @returns {number} Template id
   * @throws Fails when response isn't code 200
   */
  delete: async (params) => {
    const name = Actions.TEMPLATE_DELETE
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data
  },

  /**
   * Replaces the template contents.
   *
   * @param {object} params - Request params
   * @param {number|string} params.id - Template id
   * @param {string} params.template - The new template contents
   * @param {0|1} params.replace
   * - Update type:
   * ``0``: Replace the whole template.
   * ``1``: Merge new template with the existing one.
   * @returns {number} Template id
   * @throws Fails when response isn't code 200
   */
  update: async (params) => {
    const name = Actions.TEMPLATE_UPDATE
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data
  },

  /**
   * Changes the permission bits of a template.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Template id
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
   * @param {boolean} params.image
   * - `true` to chmod the template plus any image defined in DISK
   * @returns {number} Template id
   * @throws Fails when response isn't code 200
   */
  changePermissions: async ({ id, image, permissions }) => {
    const name = Actions.TEMPLATE_CHMOD
    const command = { name, ...Commands[name] }
    const config = requestConfig({ id, image, ...permissions }, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Changes the ownership of a template.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Template id
   * @param {{user: number, group: number}} params.ownership - Ownership data
   * @returns {number} Template id
   * @throws Fails when response isn't code 200
   */
  changeOwnership: async ({ id, ownership }) => {
    const name = Actions.TEMPLATE_CHOWN
    const command = { name, ...Commands[name] }
    const config = requestConfig({ id, ...ownership }, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Renames a Template.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Template id
   * @param {string} params.name - New name
   * @returns {number} Template id
   * @throws Fails when response isn't code 200
   */
  rename: async (params) => {
    const name = Actions.TEMPLATE_RENAME
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Locks a Template.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Template id
   * @param {1|2|3|4} params.level
   * - Lock level:
   * ``1``: Use
   * ``2``: Manage
   * ``3``: Admin
   * ``4``: All
   * @param {boolean} params.test - Check if the object is already locked to return an error
   * @returns {number} Template id
   * @throws Fails when response isn't code 200
   */
  lock: async (params) => {
    const name = Actions.TEMPLATE_LOCK
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Unlocks a Template.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - Template id
   * @returns {number} Template id
   * @throws Fails when response isn't code 200
   */
  unlock: async (params) => {
    const name = Actions.TEMPLATE_UNLOCK
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  },

  /**
   * Instantiates a new virtual machine from a template.
   *
   * @param {object} params - Request params
   * @param {number|string} params.id - Template id
   * @param {string} params.name - Name for the new VM instance
   * @param {boolean} params.hold - True to create it on hold state
   * @param {boolean} params.persistent - True to create a private persistent copy
   * @param {string} params.template - Extra template to be merged with the one being instantiated
   * @returns {number} Template id
   * @throws Fails when response isn't code 200
   */
  instantiate: async (params) => {
    const name = Actions.TEMPLATE_INSTANTIATE
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data
  },
}
