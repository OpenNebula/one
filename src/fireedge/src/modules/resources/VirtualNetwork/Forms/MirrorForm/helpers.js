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
/**
 * Normalizes a comma-separated mirror list.
 *
 * @param {string|string[]} value - Backend list
 * @returns {string[]} List entries
 */
export const mirrorList = (value) =>
  [value ?? []]
    .flat()
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean)

/**
 * Gets the selectable interfaces attached to a network.
 *
 * @param {object} vm - Virtual machine
 * @param {string|number} vnetId - Network id
 * @returns {object[]} Matching NICs
 */
export const networkNics = (vm, vnetId) =>
  [vm?.TEMPLATE?.NIC ?? []]
    .flat()
    .filter(
      (nic) =>
        nic?.NETWORK_ID != null &&
        nic?.NIC_ID != null &&
        String(nic.NETWORK_ID) === String(vnetId)
    )

/**
 * Converts a backend mirror into form values.
 *
 * @param {object} mirror - Mirror attributes
 * @returns {object} Form values
 */
export const mirrorFormValues = (mirror = {}) => {
  const { PORTS, VLANS, DIRECTION, MIRROR_ID, ...configuration } = mirror

  return {
    configuration,
    traffic: {
      DIRECTION: DIRECTION || 'BOTH',
      PORTS: mirrorList(PORTS).map((port) => {
        const [VM_ID, NIC_ID] = port.split(':')

        return { VM_ID, NIC_ID }
      }),
      VLANS: mirrorList(VLANS),
    },
    review: {},
  }
}

/**
 * Selects the attributes belonging to the selected mirror type.
 *
 * @param {object} values - Form values
 * @param {object} values.configuration - Mirror settings
 * @param {object} values.traffic - Mirror sources
 * @param {boolean} settingsOnly - Exclude sources when editing settings
 * @returns {object} Mirror attributes with explicitly serialized lists
 */
export const mirrorAttributes = (
  { configuration = {}, traffic = {} },
  settingsOnly = false
) => {
  const {
    NAME,
    TYPE,
    DESCRIPTION,
    OUTPUT_VLAN,
    REMOTE_IP,
    LOCAL_IP,
    ERSPAN_TYPE,
    ERSPAN_KEY,
    ERSPAN_INDEX,
    ERSPAN_HWID,
  } = configuration
  const attributes = {
    NAME,
    TYPE,
    DESCRIPTION: DESCRIPTION ?? '',
    DIRECTION: traffic.DIRECTION || 'BOTH',
    VLANS: (traffic.VLANS ?? []).join(','),
  }

  if (!settingsOnly) {
    attributes.PORTS = (traffic.PORTS ?? [])
      .map(({ VM_ID, NIC_ID }) => `${VM_ID}:${NIC_ID}`)
      .join(',')
  }

  if (TYPE === 'RSPAN') attributes.OUTPUT_VLAN = OUTPUT_VLAN
  if (['GRE', 'ERSPAN'].includes(TYPE)) {
    attributes.REMOTE_IP = REMOTE_IP
    attributes.LOCAL_IP = LOCAL_IP ?? ''
  }
  if (TYPE === 'ERSPAN') {
    attributes.ERSPAN_TYPE = ERSPAN_TYPE
    attributes.ERSPAN_KEY = ERSPAN_KEY
    if (ERSPAN_TYPE === 'II') attributes.ERSPAN_INDEX = ERSPAN_INDEX
    if (ERSPAN_TYPE === 'III') attributes.ERSPAN_HWID = ERSPAN_HWID
  }

  return Object.fromEntries(
    Object.entries(attributes).filter(([, value]) => value !== undefined)
  )
}
