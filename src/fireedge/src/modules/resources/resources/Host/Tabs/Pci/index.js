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
import PropTypes from 'prop-types'
import { Component } from 'react'
import { HostAPI } from '@FeaturesModule'
import { Box } from '@mui/material'
import { getHostPcis } from '@ModelsModule'
import { T } from '@ConstantsModule'
import { Table, PciProfileSelector } from '@ComponentsV2Module'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Host API data
 * @returns {Component} Host pci tab
 */
export const HostPciTab = ({ data }) => {
  const { host } = data

  const [update] = HostAPI.useUpdateHostMutation()

  // Get PCI devices from the host
  const pcis = getHostPcis(host)

  // Define table columns
  const columns = [
    {
      header: T.VM,
      id: 'vm',
      accessorFn: ({ VMID }) =>
        VMID && VMID !== -1 && VMID !== '-1' ? VMID : '-',
      grow: false,
    },
    { header: T.IfName, accessorKey: 'IFNAME' },
    { header: T.Vendor, id: 'vendor', accessorKey: 'VENDOR' },
    {
      header: T.VendorName,
      id: 'vendorName',
      accessorKey: 'VENDOR_NAME',
      truncate: true,
    },
    { header: T.Class, id: 'class', accessorKey: 'CLASS' },
    {
      header: T.ClassName,
      id: 'className',
      accessorKey: 'CLASS_NAME',
      truncate: true,
    },
    { header: T.Device, id: 'device', accessorKey: 'DEVICE' },
    {
      header: T.DeviceName,
      id: 'deviceName',
      accessorKey: 'DEVICE_NAME',
      truncate: true,
    },
    {
      header: T.ShortAddress,
      id: 'shortAddress',
      accessorKey: 'SHORT_ADDRESS',
    },
  ]

  return (
    <Box display="grid" gridTemplateColumns="1fr 3fr" gap={1} height="100%">
      <Box
        sx={{
          pr: 1,
          borderRight: '1px solid',
          borderColor: 'divider',
          height: '100%',
        }}
      >
        <PciProfileSelector
          id={host?.ID}
          host={host}
          update={update}
          resource={host}
          forceSync
        />
      </Box>

      <Table columns={columns} data={pcis} isRowsSelectable={false} />
    </Box>
  )
}

HostPciTab.propTypes = {
  data: PropTypes.object,
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

HostPciTab.displayName = 'HostPciTab'
HostPciTab.label = T.Pci
HostPciTab.id = 'pci'
HostPciTab.title = T.Pci
