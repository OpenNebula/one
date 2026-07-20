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

import { oneApi } from '@FeaturesModule'
import { getResourceSingleView } from '@modules/containers/ResourceSingleView/registry'
import {
  getResourceId,
  hasValue,
} from '@modules/containers/ResourceSingleView/stack'

const getDetailRequest = (entry = {}) => {
  const { detail } = getResourceSingleView(entry.resource) ?? {}
  const endpoint = oneApi.endpoints?.[detail?.endpoint]
  const id = getResourceId(entry.data)

  return { detail, endpoint, id }
}

/**
 * @param {object} entry - Resource stack entry
 * @returns {boolean} Whether an entry has a detail query to execute
 */
const canHydrateResource = (entry) => {
  const { endpoint, id } = getDetailRequest(entry)

  return Boolean(endpoint && hasValue(id))
}

/**
 * @param {Function} dispatch - Redux dispatch
 * @param {object} entry - Resource stack entry
 * @returns {Promise<object|undefined>} Hydrated resource data
 */
const fetchResourceDetails = async (dispatch, entry) => {
  const { detail, endpoint, id } = getDetailRequest(entry)

  if (!endpoint || !hasValue(id)) return undefined

  let request

  try {
    request = dispatch(endpoint.initiate(detail.getArgs(id)))

    const queryData = await request.unwrap()
    const resourceData = detail.select
      ? detail.select(queryData, id)
      : queryData

    return resourceData && typeof resourceData === 'object'
      ? resourceData
      : undefined
  } catch {
    return undefined
  } finally {
    request?.unsubscribe?.()
  }
}

export { canHydrateResource, fetchResourceDetails }
