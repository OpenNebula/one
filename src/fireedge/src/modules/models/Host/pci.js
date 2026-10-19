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
 * Resolve PF/VF relationships within a host and count its monitored VFs.
 *
 * @param {object} host - Host
 * @returns {object[]} PCI devices with parent interface and VF availability
 */
export const getHostPciTopology = (host = {}) => {
  const devices = [host?.HOST_SHARE?.PCI_DEVICES?.PCI ?? []]
    .flat()
    .filter(Boolean)
  const pfs = new Map(
    devices
      .filter(({ SRIOV }) => SRIOV === 'pf')
      .map((device) => [device.ADDRESS, device])
  )
  const counts = new Map()

  devices.forEach(({ SRIOV, PF_ADDRESS, VMID }) => {
    if (SRIOV !== 'vf' || !PF_ADDRESS) return
    const count = counts.get(PF_ADDRESS) ?? { total: 0, available: 0 }
    count.total += 1
    if (VMID === '-1' || VMID === -1) count.available += 1
    counts.set(PF_ADDRESS, count)
  })

  return devices.map((device) => ({
    ...device,
    HOST_ID: host.ID,
    HOST_NAME: host.NAME,
    ...(device.SRIOV === 'vf' && {
      PF_IFNAME: pfs.get(device.PF_ADDRESS)?.IFNAME,
    }),
    ...(device.SRIOV === 'pf' && {
      AVAILABLE_VFS: counts.get(device.ADDRESS)?.available ?? 0,
      TOTAL_VFS: counts.get(device.ADDRESS)?.total ?? 0,
    }),
  }))
}
