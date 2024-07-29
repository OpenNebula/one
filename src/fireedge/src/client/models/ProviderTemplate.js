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
/**
 * @typedef {object} ProviderTemplate
 * @property {string} name - Name
 * @property {string} [description] - Description
 * @property {string} provider - Provider type
 * @property {object} plain - Information in plain format
 * @property {string} plain.provider - Provider type
 * @property {object} connection - Connections
 * @property {Array} inputs - Inputs to provision form
 */

/**
 * Returns the locked connection to provider template.
 *
 * @param {ProviderTemplate} template - Provider template object
 * @param {object} providerConfig - Provider config
 * @returns {string[]} Location keys
 */
export const getLocationKeys = (template = {}, providerConfig) => {
  const { location_key: locationKey } =
    providerConfig?.[template?.provider] ?? {}

  return typeof locationKey === 'string' ? locationKey.split(',') : locationKey
}

/**
 * Returns the provision types available to provider template.
 *
 * @param {ProviderTemplate} template - Provider template object
 * @param {object} providerConfig - Provider config
 * @returns {string[]} Location keys
 */
export const getProvisionTypes = (template = {}, providerConfig) => {
  const { provision_type: provisionType } =
    providerConfig?.[template?.provider] ?? {}

  return typeof locationKey === 'string'
    ? provisionType.split(',')
    : provisionType
}

/**
 * Check if the provider template is valid format.
 *
 * @param {ProviderTemplate} template - Provider template
 * @param {object} providerConfig - Provider config
 * @returns {boolean} Returns `true` if template is valid
 */
export const isValidProviderTemplate = (template, providerConfig) => {
  const { name, provider, connection } = template
  const keys = getLocationKeys(template, providerConfig)
  const provisionTypes = getProvisionTypes(template, providerConfig)

  const hasConnection = connection !== undefined

  const locationKeyConnectionNotExists =
    !hasConnection || keys?.some((key) => connection?.[key] === undefined)

  return (
    !(keys && locationKeyConnectionNotExists) ||
    [name, provisionTypes, provider].includes(undefined)
  )
}

/**
 * Returns the not editable connections from provider template.
 * Are defined at `plain.location_key`.
 *
 * @param {ProviderTemplate} template - Provider template
 * @param {object} providerConfig - Provider config
 * @returns {object} Not editable connections
 */
export const getConnectionFixed = (template = {}, providerConfig) => {
  const { connection = {} } = template
  const keys = getLocationKeys(template, providerConfig)

  return Object.entries(connection).reduce(
    (res, [name, value]) => ({
      ...res,
      ...(keys?.includes(name) && { [name]: value }),
    }),
    {}
  )
}

/**
 * Returns the editable connections from provider template.
 *
 * @param {ProviderTemplate} template - Provider template
 * @param {object} providerConfig - Provider config
 * @returns {object} Editable connections
 */
export const getConnectionEditable = (template = {}, providerConfig) => {
  const { connection = {} } = template
  const keys = getLocationKeys(template, providerConfig)

  return Object.entries(connection).reduce(
    (res, [name, value]) => ({
      ...res,
      ...(!keys?.includes(name) && { [name]: value }),
    }),
    {}
  )
}
