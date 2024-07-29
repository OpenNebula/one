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
import { AxiosRequestConfig, Method } from 'axios'
import { defaults } from 'server/utils/constants'

const { from: fromTypes } = defaults

const getQueries = (params) =>
  Object.entries(params)
    ?.filter(([, { from }]) => from === fromTypes.query)
    ?.filter(([, { value }]) => value !== undefined)
    ?.reduce((acc, [name, { value }]) => ({ ...acc, [name]: value }), {})

const replacePathWithResources = (path = '', params) =>
  Object.entries(params)
    ?.filter(([, { from }]) => from === fromTypes.resource)
    ?.reduce(
      (replacedPath, [name, { value = '' }]) =>
        replacedPath.replace(new RegExp(`:${name}(\\??)`), value),
      path
    )

const getResources = (params) =>
  Object.values(params)
    ?.filter(({ from }) => from === fromTypes.resource)
    ?.map(({ value }) => value)
    ?.join('/')

const getDataBody = (params) =>
  Object.entries(params)
    ?.filter(([, { from }]) => from === fromTypes.postBody)
    ?.reduce((acc, [name, { value }]) => ({ ...acc, [name]: value }), {})

/**
 * @param {object} data - Data for the request
 * @param {object} command - Command request
 * @param {string} command.name - Command name
 * @param {string} [command.path] - Path to replace with resources
 * @param {Method} command.httpMethod - Method http
 * @param {object} command.params - Params to map
 * @param {object} zones - zones
 * @param {string} zones.selectedZone - selected zone
 * @param {string} zones.defaultZone - default zone
 * @returns {AxiosRequestConfig} Request configuration
 */
export const requestConfig = (data, command, zones = {}) => {
  if (command === undefined) throw new Error('command not exists')
  const { name, path, httpMethod, params = {} } = command

  /* Spread 'from' values in current params */
  const mappedParams = Object.entries(params)?.reduce(
    (result, [paraName, { from }]) => ({
      ...result,
      [paraName]: { from, value: data?.[paraName] },
    }),
    {}
  )

  const { selectedZone, defaultZone } = zones

  if (!data?.zone && selectedZone !== defaultZone) {
    mappedParams.zone = { from: fromTypes.query, value: selectedZone }
  }

  const queries = getQueries(mappedParams)
  const body = getDataBody(mappedParams)

  const url = path
    ? `/api${replacePathWithResources(path, mappedParams)}`
    : `/api/${name.replace('.', '/')}/${getResources(mappedParams)}`

  return {
    url,
    params: queries,
    data: body,
    method: httpMethod,
  }
}
