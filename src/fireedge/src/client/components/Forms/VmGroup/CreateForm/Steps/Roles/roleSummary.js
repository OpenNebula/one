/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material'
import PropTypes from 'prop-types'
import { Cancel, InfoEmpty } from 'iconoir-react'
import { T } from 'client/constants'
import { Component } from 'react'
/**
 * RoleSummary displays detailed information about a VM role, including its configuration and affinity settings.
 *
 * @param {object} props - The props that control the RoleSummary component.
 * @param {object} props.role - The role object containing the role's configuration.
 * @param {number} props.selectedRoleIndex - The index of the selected role.
 * @param {Function} props.onRemoveAffinity - Function to call when removing an affinity from a role.
 * @returns {Component} - Role summary component.
 */
const RoleSummary = ({ role, selectedRoleIndex, onRemoveAffinity }) => {
  const handleRemoveAffinity = (affinityType, hostId) => () => {
    onRemoveAffinity(affinityType, hostId)
  }
  const formatPolicy = (rolePolicy) =>
    rolePolicy === undefined
      ? 'Set a VM affinity policy.'
      : rolePolicy === 'AFFINED'
      ? T.Affined
      : rolePolicy === 'ANTI_AFFINED'
      ? T.AntiAffined
      : T.None

  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        maxHeight: '630px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}
    >
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1em',
        }}
      >
        <Typography variant="h6" component="div" gutterBottom>
          #{selectedRoleIndex + 1 ?? 0} Role Configuration
        </Typography>

        <Typography
          variant="body2"
          color={role?.NAME ? 'text.primary' : 'text.disabled'}
          gutterBottom
        >
          Name: {role?.NAME || 'Enter a name for this role.'}
        </Typography>

        <Typography
          variant="body2"
          color={
            role?.POLICY === undefined || role?.POLICY === 'None'
              ? 'text.disabled'
              : 'text.primary'
          }
          gutterBottom
        >
          Policy: {formatPolicy(role?.POLICY)}
        </Typography>

        {role?.HOST_AFFINED && role.HOST_AFFINED.length > 0 ? (
          <>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Affined Hosts:
            </Typography>
            <List sx={{ bgcolor: 'background.paper' }}>
              {role.HOST_AFFINED.map((hostId, index) => (
                <ListItem key={hostId} sx={{ p: 0, pl: 1 }}>
                  <ListItemText primary={`Host ${hostId}`} sx={{ mr: 1 }} />
                  <IconButton
                    edge="end"
                    aria-label="remove"
                    size="small"
                    onClick={handleRemoveAffinity('HOST_AFFINED', hostId)}
                  >
                    <Cancel />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </>
        ) : (
          <Typography variant="body2" color="text.disabled" gutterBottom>
            No affined hosts. Assign a set of hosts where the VMs of this role
            can be allocated.
            <Tooltip title="Affined hosts are VMs grouped together on a set of hosts to better modularize deployments and increase performance.">
              <InfoEmpty fontSize="small" />
            </Tooltip>
          </Typography>
        )}

        {role?.HOST_ANTI_AFFINED && role.HOST_ANTI_AFFINED.length > 0 ? (
          <>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Anti-Affined Hosts:
            </Typography>
            <List sx={{ bgcolor: 'background.paper' }}>
              {role.HOST_ANTI_AFFINED.map((hostId, index) => (
                <ListItem key={hostId} sx={{ p: 0, pl: 1 }}>
                  <ListItemText primary={`Host ${hostId}`} sx={{ mr: 1 }} />
                  <IconButton
                    edge="end"
                    aria-label="remove"
                    size="small"
                    onClick={handleRemoveAffinity('HOST_ANTI_AFFINED', hostId)}
                  >
                    <Cancel />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </>
        ) : (
          <Typography variant="body2" color="text.disabled" gutterBottom>
            No anti-affined hosts. Assign a set of hosts where the VMs of this
            role can&apos;t be allocated.
            <Tooltip title="Anti-affined hosts are VMs separated across different hosts to ensure redundancy and fault-tolerance. ">
              <InfoEmpty fontSize="small" />
            </Tooltip>
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Typography
          variant="subtitle2"
          color="textSecondary"
          sx={{ opacity: 0.7 }}
        >
          <strong>VM Group Configuration:</strong>
          <ul>
            <li>Define roles and placement constraints.</li>
            <li>Optimize performance and fault tolerance.</li>
            <li>Manage multi-VM applications efficiently.</li>
          </ul>
        </Typography>
      </CardActions>
    </Card>
  )
}

RoleSummary.propTypes = {
  role: PropTypes.oneOfType([
    PropTypes.shape({
      NAME: PropTypes.string,
      POLICY: PropTypes.oneOf(['AFFINED', 'ANTI_AFFINED', 'None', undefined]),
      HOST_AFFINED: PropTypes.arrayOf(PropTypes.number),
      HOST_ANTI_AFFINED: PropTypes.arrayOf(PropTypes.number),
    }),
    PropTypes.array,
    PropTypes.object,
  ]),
  selectedRoleIndex: PropTypes.number,
  onRemoveAffinity: PropTypes.func.isRequired,
}

export default RoleSummary
