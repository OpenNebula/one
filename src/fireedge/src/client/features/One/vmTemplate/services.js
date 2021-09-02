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

export const vmTemplateService = ({
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
  getVmTemplate: async params => {
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
  getVmTemplates: async params => {
    const name = Actions.TEMPLATE_POOL_INFO
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.VMTEMPLATE_POOL?.VMTEMPLATE ?? []].flat()
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
  instantiate: async params => {
    const name = Actions.TEMPLATE_INSTANTIATE
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data
  }
})
