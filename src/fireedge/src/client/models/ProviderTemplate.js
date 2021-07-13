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
/**
 * @typedef {object} ProviderTemplate
 * @property {string} name - Name
 * @property {string} [description] - Description
 * @property {string} provider - Provider type
 * @property {object} plain - Information in plain format
 * @property {string} [plain.image] - Image to card
 * @property {string} plain.provision_type - Provision type
 * @property {string|string[]} plain.location_key - Location key/s
 * @property {object} connection - Connections
 * @property {Array} inputs - Inputs to provision form
 */

/**
 * Check if the provider template is valid format.
 *
 * @param {ProviderTemplate} template - Provider template
 * @returns {boolean} Returns `true` if template is valid
 */
export const isValidProviderTemplate = ({ name, provider, plain, connection }) => {
  const { provision_type: provisionType, location_key: locationKey } = plain ?? {}

  const keys = typeof locationKey === 'string' ? locationKey.split(',') : locationKey

  const hasConnection = connection !== undefined

  const locationKeyConnectionNotExists =
    !hasConnection || keys.some(key => connection?.[key] === undefined)

  return (
    !(locationKey && locationKeyConnectionNotExists) ||
    [name, provisionType, provider].includes(undefined)
  )
}

/**
 * Returns the locked connection from the provider template.
 *
 * @param {ProviderTemplate} template - Provider template object
 * @returns {string[]} Location keys
 */
export const getLocationKeys = ({ plain: { location_key: locationKey } = {} }) =>
  typeof locationKey === 'string' ? locationKey.split(',') : locationKey

/**
 * Returns the not editable connections from provider template.
 * Are defined at `plain.location_key`.
 *
 * @param {ProviderTemplate} template - Provider template
 * @returns {object} Not editable connections
 */
export const getConnectionFixed = ({ connection = {}, ...template }) => {
  const keys = getLocationKeys(template)

  return Object.entries(connection).reduce((res, [name, value]) => ({
    ...res,
    ...keys.includes(name) && { [name]: value }
  }), {})
}

/**
 * Returns the editable connections from provider template.
 *
 * @param {ProviderTemplate} template - Provider template
 * @returns {object} Editable connections
 */
export const getConnectionEditable = ({ connection = {}, ...template } = {}) => {
  const keys = getLocationKeys(template)

  return Object.entries(connection).reduce((res, [name, value]) => ({
    ...res,
    ...!keys.includes(name) && { [name]: value }
  }), {})
}
