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
import { Service, ROLE_STATES, SERVICE_STATES, STATES } from '@ConstantsModule'
import { sentenceCase } from '@UtilsModule'

const withDisplayName = (state) =>
  state && { ...state, displayName: sentenceCase(state.name) }

/**
 * Returns information about Service state.
 *
 * @param {Service} service - Service
 * @returns {STATES.StateInfo} - Service state object
 */
export const getServiceState = ({ TEMPLATE = {} } = {}) =>
  withDisplayName(SERVICE_STATES[TEMPLATE?.BODY?.state])

/**
 * Returns the roles of a Service.
 *
 * @param {Service} service - Service
 * @returns {Array} - Service roles
 */
export const getServiceRoles = ({ TEMPLATE = {} } = {}) =>
  [].concat(TEMPLATE?.BODY?.roles ?? []).filter(Boolean)

/**
 * Returns the nodes of a Service role.
 *
 * @param {object} role - Service role
 * @returns {Array} - Service role nodes
 */
export const getServiceRoleNodes = (role = {}) =>
  [].concat(role?.nodes ?? []).filter(Boolean)

/**
 * Returns all nodes of a Service.
 *
 * @param {Service} service - Service
 * @returns {Array} - Service nodes with role information
 */
export const getServiceNodes = (service) =>
  getServiceRoles(service).flatMap((role = {}) =>
    getServiceRoleNodes(role).map((node = {}) => ({
      ...node,
      ROLE: role?.name,
    }))
  )

/**
 * Returns VMs from Service roles.
 *
 * @param {Service} service - Service
 * @param {string|string[]} selectedRole - Service role name(s)
 * @returns {Array} - Service role VMs with role information
 */
export const getRoleVms = (service, selectedRole = []) => {
  const roleNames = [].concat(selectedRole).filter(Boolean).map(String)

  return getServiceNodes(service)
    .filter(({ ROLE } = {}) => roleNames.includes(String(ROLE)))
    .map(({ vm_info: vmInfo = {}, deploy_id: deployId, ROLE }) => ({
      ...(vmInfo?.VM ?? {}),
      ID: String(vmInfo?.VM?.ID ?? deployId ?? ''),
      ROLE,
    }))
    .filter(({ ID }) => ID)
}

/**
 * Returns the total number of roles in a Service.
 *
 * @param {Service} service - Service
 * @returns {number} - Total roles
 */
export const getServiceTotalRoles = (service) => getServiceRoles(service).length

/**
 * Returns the total number of VMs in a Service.
 *
 * @param {Service} service - Service
 * @returns {number} - Total VMs
 */
export const getServiceTotalVms = (service) => getServiceNodes(service).length

const normalizeNetworkReference = (reference) =>
  String(reference ?? '')
    .replace(/^\$/, '')
    .trim()

const getServiceNetworkValues = ({ TEMPLATE = {} } = {}) =>
  []
    .concat(TEMPLATE?.BODY?.networks_values ?? [])
    .flat()
    .filter(Boolean)
    .reduce(
      (valuesByName, networkValues) => ({
        ...valuesByName,
        ...networkValues,
      }),
      {}
    )

const getNetworkIdFromDefinition = (definition) =>
  String(definition ?? '').match(/(?:id|reserve_from):([^|]+)/)?.[1]

const getRoleNetworkReferences = (role = {}) =>
  []
    .concat(role?.template_contents?.NIC ?? [])
    .flat()
    .filter(Boolean)
    .flatMap(({ NETWORK_ID: networkId, NETWORK: network }) => [
      networkId,
      network,
    ])
    .map(normalizeNetworkReference)
    .filter(Boolean)

/**
 * Returns the virtual networks defined by a Service and their assigned roles.
 *
 * @param {Service} service - Service
 * @returns {{ID: string|number, NAME: string, ROLES: string}[]} Service networks
 */
export const getServiceNetworks = (service = {}) => {
  const networks = service?.TEMPLATE?.BODY?.networks ?? {}
  const networkValues = getServiceNetworkValues(service)
  const roles = getServiceRoles(service)

  return Object.entries(networks).map(([name, definition]) => {
    const id =
      networkValues?.[name]?.id ?? getNetworkIdFromDefinition(definition)
    const references = new Set(
      [name, id].map(normalizeNetworkReference).filter(Boolean)
    )
    const assignedRoles = roles
      .filter((role) =>
        getRoleNetworkReferences(role).some((reference) =>
          references.has(reference)
        )
      )
      .map((role) => role?.name)
      .filter(Boolean)

    return {
      ID: id,
      NAME: name,
      ROLES: assignedRoles.join(', ') || '-',
    }
  })
}

/**
 * Returns the total number of networks in a Service.
 *
 * @param {Service} service - Service
 * @returns {number} - Total networks
 */
export const getServiceTotalNetworks = ({ TEMPLATE = {} } = {}) =>
  Object.keys(TEMPLATE?.BODY?.networks ?? {}).length

/**
 * Returns read-only Service data attributes.
 *
 * @param {Service} service - Service
 * @returns {{key: string, value: *}[]} - Service data attributes
 */
export const getServiceDataAttributes = ({ TEMPLATE = {} } = {}) => {
  const body = TEMPLATE?.BODY ?? {}
  const keys = [
    'description',
    'user_inputs_values',
    'custom_attrs',
    'custom_attrs_values',
    'networks_values',
    'on_hold',
  ]

  return keys
    .filter((key) => Object.prototype.hasOwnProperty.call(body, key))
    .map((key) => ({ key, value: body[key] }))
}

/**
 * Returns information about Service state.
 *
 * @param {number} state - Role state
 * @returns {STATES.StateInfo} - Service state object
 */
export const getRoleState = (state) => withDisplayName(ROLE_STATES?.[state])
