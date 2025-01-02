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
 * @typedef {object} ProvisionTemplate
 * @property {string} name - Name
 * @property {string} image - Image to card
 * @property {string} provider - Provider type
 * @property {object} defaults - Common configuration attributes
 * @property {object} [defaults.provision] - Provision information
 * @property {string} [defaults.provision.provider_name] - Provider name
 * @property {{
 * provision: { provider_name: string }
 * }[]} [hosts] - Provision hosts
 * @property {object} cluster - Provision cluster
 * @property {object[]} datastores - Provision datastores
 * @property {object[]} networks - Provision networks
 * @property {object[]} vnetTemplate - Provision network templates
 * @property {Array} inputs - Inputs to provision form
 */

/**
 * Returns the provider name from provision template.
 *
 * @param {ProvisionTemplate} template - Provision template
 * @returns {string} Provider name
 */
export const getProviderName = ({ defaults, hosts }) =>
  defaults?.provision?.provider_name ?? hosts?.[0]?.provision.provider_name

/**
 * Check if the provision template is valid format.
 *
 * @param {ProvisionTemplate} template - Provision template
 * @returns {boolean} Returns `true` if template is valid
 */
export const isValidProvisionTemplate = (template) => {
  const { name, provider } = template
  const providerName = getProviderName(template)

  return !(providerName === undefined || [name, provider].includes(undefined))
}
