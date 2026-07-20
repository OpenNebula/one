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
  Network,
  Check,
  Copy,
} from 'iconoir-react'
import { T } from '@ConstantsModule'
import { useClipboard } from '@HooksModule'
import { useTranslation } from '@ProvidersModule'
import { TagList } from '@modules/componentsv2/primitives/Tags/List'
import { getStyles } from '@modules/componentsv2/composed/Cards/Default/slots/capacity/styles'

const CAPACITY_ITEMS = [
  { Icon: Cpu, label: T.CPU, valueKey: 'cpu' },
  { Icon: ElectronicsChip, label: T.Memory, valueKey: 'memory' },
  { Icon: HardDrive, label: T.DiskSize, valueKey: 'disk' },
]

/**
 * Displays the CPU, memory, disk capacity and IP values of a resource card.
 *
 * @param {object} props - Component properties
 * @param {*} props.cpu - CPU capacity value
 * @param {*} props.memory - Memory capacity value
 * @param {*} props.disk - Total disk capacity value
 * @param {string[]} props.ips - IP addresses to display
 * @param {object} ref - Forwarded reference
 * @returns {Component} Capacity card slot
 */
export const CapacitySlot = forwardRef(
  ({ cpu, memory, disk, ips = [] }, ref) => {
    const { translate } = useTranslation()
    const { copy, isCopied } = useClipboard()
    const values = { cpu, memory, disk }

    return (
      <Box sx={(theme) => getStyles({ theme })} ref={ref}>
        {CAPACITY_ITEMS.map(({ Icon, label, valueKey }) => (
          <Box key={valueKey} className="capacity-item">
            <Icon className="capacity-icon" />
            <span className="capacity-label">{`${translate(label)}:`}</span>
            <span className="capacity-value">{values[valueKey] ?? '-'}</span>
          </Box>
        ))}
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
      </Box>
    )
  }
)

CapacitySlot.propTypes = {
  cpu: PropTypes.node,
  memory: PropTypes.node,
  disk: PropTypes.node,
  ips: PropTypes.arrayOf(PropTypes.string),
}

CapacitySlot.displayName = 'CapacitySlot'
