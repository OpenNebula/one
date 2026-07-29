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

import { Component, forwardRef } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import {
  Cpu,
  ElectronicsChip,
  HardDrive,
  Cart,
  Clock,
  CompactDisc,
  HighPriority,
  Network,
  ModernTv,
  BoxIso,
  Check,
  Copy,
} from 'iconoir-react'
import { T } from '@ConstantsModule'
import { useClipboard } from '@HooksModule'
import { useTranslation } from '@ProvidersModule'
import { TagList } from '@modules/componentsv2/primitives/Tags/List'
import { getStyles } from '@modules/componentsv2/composed/Cards/Default/slots/icon/styles'

const CAPACITY_ITEMS = [
  { Icon: Cpu, label: T.CPU, valueKey: 'cpu' },
  { Icon: ElectronicsChip, label: T.Memory, valueKey: 'memory' },
  { Icon: CompactDisc, label: T.Size, valueKey: 'size' },
  { Icon: Cart, label: T.Marketplace, valueKey: 'marketplace' },
  { Icon: HardDrive, label: T.DiskSize, valueKey: 'disk' },
  { Icon: HighPriority, label: T.Priority, valueKey: 'priority' },
  { Icon: Clock, label: T.LastBackupTimeInfo, valueKey: 'lastBackupTime' },
  { Icon: CompactDisc, label: T.Images, valueKey: 'images' },
  { Icon: BoxIso, label: T.Roles, valueKey: 'roles' },
  { Icon: ModernTv, label: T.VMs, valueKey: 'vms' },
  { Icon: Network, label: T.Networks, valueKey: 'networks' },
  { Icon: Network, label: T.NICs, valueKey: 'nics' },
]

/**
 * Displays the provided capacity and IP values of a resource card.
 *
 * @param {object} props - Component properties
 * @param {*} [props.cpu] - CPU capacity value
 * @param {*} [props.memory] - Memory capacity value
 * @param {*} [props.size] - Resource size
 * @param {*} [props.marketplace] - Marketplace name
 * @param {*} [props.disk] - Total disk capacity value
 * @param {*} [props.priority] - Backup job priority
 * @param {*} [props.lastBackupTime] - Last backup time
 * @param {*} [props.images] - Number of image-backed disks
 * @param {*} [props.roles] - Number of service roles
 * @param {*} [props.vms] - Number of virtual machines
 * @param {*} [props.networks] - Number of defined virtual networks
 * @param {*} [props.nics] - Number of network interfaces
 * @param {string[]} [props.ips] - IP addresses to display
 * @param {{Icon: Component, label: string, value: *}[]} [props.items] - Extra metrics
 * @param {object} ref - Forwarded reference
 * @returns {Component} Icon card slot
 */
export const IconSlot = forwardRef(
  (
    {
      cpu,
      memory,
      size,
      marketplace,
      disk,
      priority,
      lastBackupTime,
      images,
      roles,
      vms,
      networks,
      nics,
      ips,
      items = [],
    },
    ref
  ) => {
    const { translate } = useTranslation()
    const { copy, isCopied } = useClipboard()
    const values = {
      cpu,
      memory,
      size,
      marketplace,
      disk,
      priority,
      lastBackupTime,
      images,
      roles,
      vms,
      networks,
      nics,
    }
    const capacityItems = CAPACITY_ITEMS.filter(
      ({ valueKey }) => values[valueKey] !== undefined
    ).map(({ Icon, label, valueKey }) => ({
      Icon,
      label,
      value: values[valueKey],
    }))
    const metrics = [...capacityItems, ...items]
    const hasIps = Array.isArray(ips)

    return (
      <Box sx={(theme) => getStyles({ theme })} ref={ref}>
        {metrics.map(({ Icon, label, value }, idx) => (
          <Box key={`${label}-${idx}`} className="capacity-item">
            <Icon className="capacity-icon" />
            <span className="capacity-label">{`${translate(label)}:`}</span>
            <span className="capacity-value">{value ?? '-'}</span>
          </Box>
        ))}
        {hasIps && (
          <Box
            className="capacity-item"
            onClick={(event) => event.stopPropagation()}
          >
            <Network className="capacity-icon" />
            <span className="capacity-label">{`${translate(T.IP)}:`}</span>
            {ips.length > 0 ? (
              <TagList
                max={1}
                tags={ips.map((ip) => ({
                  title: ip,
                  endIcon: isCopied(ip) ? <Check /> : <Copy />,
                  onClick: (event) => {
                    event.stopPropagation()
                    copy(ip)
                  },
                }))}
              />
            ) : (
              <span className="capacity-value">-</span>
            )}
          </Box>
        )}
      </Box>
    )
  }
)

IconSlot.propTypes = {
  cpu: PropTypes.node,
  memory: PropTypes.node,
  size: PropTypes.node,
  marketplace: PropTypes.node,
  disk: PropTypes.node,
  priority: PropTypes.node,
  lastBackupTime: PropTypes.node,
  images: PropTypes.node,
  roles: PropTypes.node,
  vms: PropTypes.node,
  networks: PropTypes.node,
  nics: PropTypes.node,
  ips: PropTypes.arrayOf(PropTypes.string),
  items: PropTypes.arrayOf(
    PropTypes.shape({
      Icon: PropTypes.elementType.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.node,
    })
  ),
}

IconSlot.displayName = 'IconSlot'
