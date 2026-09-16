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
import { Box } from '@mui/material'

import { HostAPI } from '@FeaturesModule'
import { getHostPcis, getHostNvswitchPartitions } from '@ModelsModule'
import { T } from '@ConstantsModule'
import { Table, PciProfileSelector } from '@ComponentsModule'
import { getStyles } from '@modules/resources/Host/Tabs/Pci/styles'

const PCI_COLUMNS = [
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
  },
  { header: T.Class, id: 'class', accessorKey: 'CLASS' },
  {
    header: T.ClassName,
    id: 'className',
    accessorKey: 'CLASS_NAME',
  },
  { header: T.Device, id: 'device', accessorKey: 'DEVICE' },
  {
    header: T.DeviceName,
    id: 'deviceName',
    accessorKey: 'DEVICE_NAME',
  },
  {
    header: T.ShortAddress,
    id: 'shortAddress',
    accessorKey: 'SHORT_ADDRESS',
  },
]

const PARTITION_COLUMNS = [
  { header: T.PartitionId, accessorKey: 'PARTITION_ID' },
  {
    header: T.Status,
    accessorKey: 'PARTITION_STATUS',
    cell: ({ getValue }) => getValue() || '-',
  },
  { header: T.GpuCount, accessorKey: 'NUM_GPUS' },
  { header: T.GpuIds, accessorKey: 'PARTITION_GPU_IDS' },
  {
    header: T.GpuPciAddresses,
    accessorKey: 'PARTITION_GPU_ADDR',
    cell: ({ getValue }) => (
      <Box className="partition-addresses">{getValue() || '-'}</Box>
    ),
  },
]

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
  const partitions = getHostNvswitchPartitions(host)

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="pci-profile-selector">
        <PciProfileSelector
          id={host?.ID}
          host={host}
          update={update}
          resource={host}
          forceSync
        />
      </Box>

      <Box className="pci-tables">
        <Table columns={PCI_COLUMNS} data={pcis} isRowsSelectable={false} />
        {partitions.length > 0 && (
          <Table
            title={T.NvswitchPartitions}
            columns={PARTITION_COLUMNS}
            data={partitions}
            dataCy="host-nvswitch-partitions"
            isRowsSelectable={false}
            isEnableSearchBar
            isEnableSort
          />
        )}
      </Box>
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
