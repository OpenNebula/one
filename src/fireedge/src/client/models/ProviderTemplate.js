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
export const isValidProviderTemplate = ({ name, provider, plain = {}, connection }) => {
  const { provision_type: provisionType, location_key: locationKey } = plain

  const keys = typeof locationKey === 'string' ? locationKey.split(',') : locationKey

  const hasConnection = connection !== undefined

  const locationKeyConnectionNotExists =
    !hasConnection || keys.some(key => connection?.[key] === undefined)

  return (
    !(locationKey && locationKeyConnectionNotExists) ||
    [name, provisionType, provider].includes(undefined)
  )
}

export const getLocationKeys = ({ location_key: locationKey }) =>
  typeof locationKey === 'string' ? locationKey.split(',') : locationKey

export const getConnectionFixed = ({ connection = {}, ...template }) => {
  const keys = getLocationKeys(template?.plain)

  return Object.entries(connection).reduce((res, [name, value]) => ({
    ...res,
    ...keys.includes(name) && { [name]: value }
  }), {})
}

export const getConnectionEditable = ({ connection = {}, ...template }) => {
  const keys = getLocationKeys(template?.plain)

  return Object.entries(connection).reduce((res, [name, value]) => ({
    ...res,
    ...!keys.includes(name) && { [name]: value }
  }), {})
}
