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
import PropTypes from 'prop-types'
import {
  Box,
  Chip,
  Tooltip,
  IconButton,
  Typography,
  CardActions,
} from '@mui/material'
import { DeleteCircledOutline } from 'iconoir-react'
import { Component } from 'react'

/**
 * AffinityGroup component displays the affinity groups and their descriptions.
 * It allows for the deletion of both groups and individual roles within them.
 *
 * @param {object} props - The props that are passed to this component.
 * @param {string} props.groupType - The type of group, either 'AFFINED' or 'ANTI_AFFINED'.
 * @param {Array} props.groups - The list of groups, each an array of roles.
 * @param {Function} props.onDeleteGroup - Callback function for deleting an entire group.
 * @param {Function} props.onDeleteRole - Callback function for deleting a single role from a group.
 * @returns {Component} A component displaying affinity groups.
 */
export const AffinityGroup = ({
  groupType,
  groups,
  onDeleteGroup,
  onDeleteRole,
}) => {
  const isAffined = groupType === 'AFFINED'

  const description = isAffined
    ? 'Affined groups improve performance and communication by placing related VM roles together on the same host. Ideal for roles that require high interactivity and shared resources.                               '
    : 'Anti-Affined groups enhance reliability and fault tolerance by distributing VM roles across different hosts. Suitable for roles that need isolation to prevent resource contention and single points of failure.'

  const useCases = isAffined
    ? [
        'Database clusters requiring shared storage.',
        'High-performance computing with intensive data exchange.',
        'Real-time processing applications demanding low-latency communication.',
      ]
    : [
        'Operational VMs separated from backup VMs.',
        'Diverse application servers to prevent simultaneous failures.',
        'Resource-heavy VMs spread out to avoid performance bottlenecks.',
      ]

  return (
    <>
      {groups.length === 0 ? (
        <CardActions
          sx={{ p: 2, pt: 0, flexDirection: 'column', alignItems: 'start' }}
        >
          <Typography
            variant="subtitle2"
            color="textSecondary"
            sx={{
              opacity: 0.7,
              textAlign: 'start',
              mb: 1,
              minHeight: '100px',
              maxHeight: '100px',
            }}
          >
            {description}
          </Typography>
          <Typography
            component="span"
            variant="body2"
            color="textSecondary"
            sx={{ mt: 14, opacity: 0.7, textAlign: 'start' }}
          >
            <strong>Potential Use Cases:</strong>
            <ul>
              {useCases.map((useCase, index) => (
                <li key={index}>{useCase}</li>
              ))}
            </ul>
          </Typography>
        </CardActions>
      ) : (
        groups.map(
          (group, groupIndex) =>
            group?.length >= 2 && (
              <Box
                key={`${groupIndex} + ${group?.length}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  py: 1,
                  my: 1,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  overflow: 'auto',
                }}
              >
                <Tooltip title="Remove Group" arrow>
                  <IconButton
                    onClick={() => onDeleteGroup(groupIndex, groupType)}
                    sx={{ color: 'error.main', padding: '4px', ml: '4px' }}
                  >
                    <DeleteCircledOutline
                      style={{ width: '26px', height: '26px' }}
                    />
                  </IconButton>
                </Tooltip>

                {group.map((role, roleIndex) => (
                  <Chip
                    key={role}
                    label={role}
                    onDelete={() =>
                      onDeleteRole(roleIndex, groupIndex, groupType)
                    }
                    variant="outlined"
                    sx={{
                      ml: 1,
                    }}
                  />
                ))}
              </Box>
            )
        )
      )}
    </>
  )
}

AffinityGroup.propTypes = {
  groupType: PropTypes.oneOf(['AFFINED', 'ANTI_AFFINED']).isRequired,
  groups: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  onDeleteGroup: PropTypes.func.isRequired,
  onDeleteRole: PropTypes.func.isRequired,
}
