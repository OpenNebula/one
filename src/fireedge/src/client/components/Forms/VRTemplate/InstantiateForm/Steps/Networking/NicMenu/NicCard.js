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
import { Component } from 'react'
import PropTypes from 'prop-types'
import { Box, IconButton, Typography, Tooltip } from '@mui/material'
import {
  DeleteCircledOutline as RemoveIcon,
  Network as ManagementIcon,
  IpAddress,
  HistoricShield as SecurityGroupIcon,
  Computer as RdpIcon,
  TerminalSimple as SshIcon,
} from 'iconoir-react'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * Renders a NIC card with details and actions.
 *
 * @param {object} props - The props object.
 * @param {object} props.info - The NIC information object.
 * @param {Function} props.removeNic - A function to remove the NIC.
 * @param {Function} props.selectNic - A function to select the NIC.
 * @param {boolean} props.active - Whether the NIC is currently active.
 * @returns {Component} The rendered `NicCard` component.
 */
const NicCard = ({ info = {}, removeNic, selectNic, active } = {}) => {
  const {
    network,
    IP: ip,
    IP6: ipv6,
    secgroup,
    nicId,
    VROUTER_MANAGEMENT: management,
    autonetworkselect,
    sshconnection,
    rdpconnection,
  } = info

  return (
    <Box
      display="flex"
      flexDirection="column"
      onClick={() => selectNic(nicId)}
      sx={{
        height: '100%',
        width: '100%',
        maxHeight: '100px',
        minHeight: '100px',
        minWidth: '100%',
        border: active ? '2px solid' : '1px solid',
        opacity: active ? '100%' : '80%',
        borderColor: 'divider',
        borderRadius: '4px',
        overflow: 'auto',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          p: 1,
        }}
      >
        <IconButton
          sx={{
            borderRadius: '50%',
            padding: '3px',
          }}
          onClick={(event) => {
            event.stopPropagation()
            removeNic(nicId)
          }}
        >
          <RemoveIcon />
        </IconButton>
      </Box>

      <Box
        display="flex"
        flexDirection={'row'}
        alignItems="center"
        gap={1}
        style={{
          padding: '0.5em',
        }}
      >
        <Box
          sx={{
            overflow: 'hidden',
            display: 'flex',
            flex: '1',
            gap: '1em',
            flexGrow: '1',
            flexDirection: 'row',
            width: 0,
            maxWidth: '85%',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <Tooltip title={`#${nicId?.slice(0, 10)}`} arrow>
            <Typography noWrap variant="body1">
              {autonetworkselect ? Tr(T['nic.card.automatic']) : network}
            </Typography>
          </Tooltip>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: '4px',
            }}
          >
            {management && (
              <Tooltip title={Tr(T['nic.card.management'])} arrow>
                <ManagementIcon height={18} width={18} />
              </Tooltip>
            )}

            {rdpconnection && (
              <Tooltip title={Tr(T.RdpConnection)} arrow>
                <RdpIcon height={18} width={18} />
              </Tooltip>
            )}

            {sshconnection && (
              <Tooltip title={Tr(T.SshConnection)} arrow>
                <SshIcon height={18} width={18} />
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>

      {/* Spacer */}
      <Box flexGrow={1} />

      <Box
        display="flex"
        flexDirection="row"
        style={{
          paddingTop: '2px',
          paddingLeft: '4px',
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{
            width: 'calc(60%)',
          }}
        >
          <Tooltip title="IPv4" arrow>
            <IpAddress height={28} width={28} />
          </Tooltip>
          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: 'calc(100%)',
              whiteSpace: 'nowrap',
            }}
          >
            <Typography noWrap variant="body2">
              {ip || 'IPv4'}
            </Typography>
          </Box>
        </Box>

        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{
            paddingX: '1em',
          }}
        >
          <Tooltip title="Security Group" arrow>
            <SecurityGroupIcon height={28} width={28} />
          </Tooltip>

          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: 'calc(100%)',
              whiteSpace: 'nowrap',
            }}
          >
            <Typography noWrap variant="body2">
              {secgroup || Tr(T.SecurityGroup)}
            </Typography>
          </Box>
        </Box>

        {/* Spacer */}
        <Box flexGrow={1} />
      </Box>

      <Box paddingLeft={'4px'} paddingTop={'2px'}>
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{
            width: 'calc(95%)',
          }}
        >
          <Tooltip title="IPv6" arrow>
            <IpAddress />
          </Tooltip>
          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: 'calc(100%)',
              whiteSpace: 'nowrap',
            }}
          >
            <Typography noWrap variant="body2">
              {ipv6 || 'IPv6'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

NicCard.propTypes = {
  info: PropTypes.shape({
    network: PropTypes.string,
    ip: PropTypes.string,
    secgroup: PropTypes.string,
    nicId: PropTypes.string,
    management: PropTypes.bool,
  }),
  removeNic: PropTypes.func,
  selectNic: PropTypes.func,
  active: PropTypes.bool,
}

export default NicCard
