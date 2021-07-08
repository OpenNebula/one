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
import { JWT_NAME } from 'client/constants'
import { removeStoreData } from 'client/utils'
import { from as resourceFrom } from 'server/utils/constants/defaults'

export const getQueries = params =>
  Object.entries(params)
    ?.filter(
      ([, { from, value }]) =>
        from === resourceFrom.query && value !== undefined
    )
    ?.map(([name, { value }]) => `${name}=${encodeURI(value)}`)
    ?.join('&')

export const getResources = params =>
  Object.values(params)
    ?.filter(({ from }) => from === resourceFrom.resource)
    ?.map(({ value }) => value)
    ?.join('/')

export const getDataBody = params =>
  Object.entries(params)
    ?.filter(([, { from }]) => from === resourceFrom.postBody)
    ?.reduce((acc, [name, { value }]) => ({ ...acc, [name]: value }), {})

export const requestParams = (data, command) => {
  if (command === undefined) throw new Error('command not exists')
  const { name, httpMethod, params } = command

  /* Spread 'from' values in current params */
  const mappedParams =
    Object.entries(params)?.reduce(
      (acc, [param, { from }]) => ({
        ...acc,
        [param]: { from, value: data[param] }
      }),
      {}
    ) ?? {}

  const queries = getQueries(mappedParams)
  const resources = getResources(mappedParams)
  const body = getDataBody(mappedParams)

  const url = `/api/${name.replace('.', '/')}`

  return {
    url: `${url}/${resources}?${queries}`,
    options: {
      data: body,
      method: httpMethod,
      authenticate: true,
      error: err => {
        removeStoreData(JWT_NAME)
        return err?.message
      }
    }
  }
}
