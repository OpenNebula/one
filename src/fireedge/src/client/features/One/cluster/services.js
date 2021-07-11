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
import { Actions, Commands } from 'server/utils/constants/commands/cluster'
import { httpCodes } from 'server/utils/constants'
import { requestConfig, RestClient } from 'client/utils'

export const clusterService = ({
  /**
   * Retrieves information for the cluster.
   *
   * @param {object} data - Request parameters
   * @param {string} data.id - Cluster id
   * @returns {object} Get cluster identified by id
   * @throws Fails when response isn't code 200
   */
  getCluster: async ({ id }) => {
    const name = Actions.CLUSTER_INFO
    const command = { name, ...Commands[name] }
    const config = requestConfig({ id }, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.CLUSTER ?? {}
  },

  /**
   * Retrieves information for all the clusters in the pool.
   *
   * @returns {Array} List of clusters
   * @throws Fails when response isn't code 200
   */
  getClusters: async () => {
    const name = Actions.CLUSTER_POOL_INFO
    const command = { name, ...Commands[name] }
    const config = requestConfig(undefined, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.CLUSTER_POOL?.CLUSTER ?? []].flat()
  }
})
