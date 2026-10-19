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
export const NIC_PCI_SELECTORS = [
  'DEVICE',
  'CLASS',
  'VENDOR',
  'SHORT_ADDRESS',
  'PF_IFNAME',
]

/**
 * Reconstruct NIC selection without requiring current host inventory.
 * The PF interface selector takes precedence over addresses populated during allocation.
 *
 * @param {object} pci - PCI request
 * @param {object[]} devices - Host PCI network devices
 * @returns {object} PCI request with form selection values
 */
export const getNicPciFormValues = (pci = {}, devices = []) => {
  const attributes = ['DEVICE', 'CLASS', 'VENDOR']
  const device = devices.find((candidate) =>
    pci.SHORT_ADDRESS
      ? candidate.SHORT_ADDRESS === pci.SHORT_ADDRESS
      : attributes.every((key) => candidate[key] === pci[key])
  )
  if (
    pci.TYPE !== 'NIC' &&
    !pci.PF_IFNAME &&
    !String(pci.CLASS ?? device?.CLASS ?? '').startsWith('02')
  ) {
    return pci
  }

  const mode = pci.PF_IFNAME
    ? 'pf_ifname'
    : ['automatic', 'manual'].includes(pci.PCI_SELECTION_MODE)
    ? pci.PCI_SELECTION_MODE
    : pci.SHORT_ADDRESS
    ? 'manual'
    : 'automatic'
  const shortAddress =
    pci.SHORT_ADDRESS ?? (device ? `${device.BUS}:${device.SLOT}.x` : '')

  const selection = {
    PCI_TYPE:
      mode === 'pf_ifname' || device?.SRIOV === 'vf'
        ? 'vf'
        : pci.PCI_TYPE ?? 'pf',
    PCI_SELECTION_MODE: mode,
    PCI_ADDRESS:
      mode === 'pf_ifname'
        ? undefined
        : pci.PCI_ADDRESS ??
          `${attributes
            .map((key) => pci[key] ?? device?.[key] ?? '')
            .join(':')}@${shortAddress}@${device?.HOST_ID ?? ''}`,
  }

  return {
    ...Object.fromEntries(
      Object.entries(pci).filter(([key]) => !NIC_PCI_SELECTORS.includes(key))
    ),
    ...getNicPciAttributes({ ...pci, ...selection }),
    ...selection,
  }
}

/**
 * Serialize exactly one selector family from the NIC form.
 *
 * @param {object} advanced - Advanced NIC form values
 * @returns {object} PCI attributes, or an empty object for an emulated NIC
 */
export const getNicPciAttributes = (advanced = {}) => {
  const { PCI_TYPE, PCI_SELECTION_MODE: mode, PCI_ADDRESS } = advanced
  if (advanced.NETWORK_MODE === 'dummy' || PCI_TYPE === 'emulated') return {}

  let selector
  if (PCI_TYPE === 'vf' && mode === 'pf_ifname') {
    selector = { PF_IFNAME: advanced.PF_IFNAME }
  } else if (PCI_ADDRESS) {
    const [deviceClassVendor, shortAddress] = PCI_ADDRESS.split('@')
    const [DEVICE, CLASS, VENDOR] = deviceClassVendor.split(':')
    selector =
      mode === 'manual'
        ? { SHORT_ADDRESS: shortAddress }
        : { DEVICE, CLASS, VENDOR }
  }

  return selector ? { ...selector, TYPE: 'NIC' } : {}
}
