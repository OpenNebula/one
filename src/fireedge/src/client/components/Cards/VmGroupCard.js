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
import { Component } from 'react'
import { Group, Lock } from 'iconoir-react'
import {
  Typography,
  Chip,
  Box,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'

import { StatusCircle } from 'client/components/Status'
import { getState } from 'client/models/VmGroup'
import { T } from 'client/constants'

/**
 * VmGroupCard component to display vmgroup details.
 *
 * @param {object} props - Component props
 * @param {object} props.vmgroup - VmGroup details
 * @param {object} props.rootProps - Additional props for the root element
 * @returns {Component} VmGroupCard component
 */
const VmGroupCard = ({ vmgroup, rootProps }) => {
  const { ID, NAME, GNAME, LOCK, ROLES } = vmgroup
  const { color: stateColor, name: stateName } = getState(LOCK)

  return (
    <Box {...rootProps} sx={{ display: 'flex', p: 2, gap: 2 }}>
      <Box
        display="flex"
        sx={{
          width: 250,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Box display="flex" alignItems="center">
          <StatusCircle color={stateColor} tooltip={stateName} />
          <Typography noWrap ml={1}>
            {NAME}
          </Typography>
          {LOCK && (
            <Tooltip title="Locked">
              <Lock ml={1} />
            </Tooltip>
          )}
        </Box>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="flex-start"
          mt={2}
        >
          <Typography variant="caption">{`#${ID}`}</Typography>
          <Box display="flex" alignItems="center" mt={1}>
            <Tooltip title={`Group: ${GNAME}`}>
              <Box display="flex" alignItems="center" mr={2}>
                <Group />
                <Typography variant="caption" ml={1}>
                  {GNAME}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </Box>
      </Box>
      <Box sx={{ flexGrow: 1, mt: 1, zIndex: 998, display: 'flex' }}>
        {ROLES?.ROLE && <RolesComponent roles={ROLES.ROLE} />}
      </Box>
    </Box>
  )
}

/**
 * RolesComponent to display roles in accordions.
 *
 * @param {object} props - The props object.
 * @param {Array} props.roles - The roles array.
 * @returns {Component} Roles component.
 */
const RolesComponent = ({ roles }) => {
  const rolesArray = Array.isArray(roles) ? roles : [roles]

  const affinedRoles = rolesArray.filter((role) => role?.POLICY === 'AFFINED')
  const antiAffinedRoles = rolesArray.filter(
    (role) => role?.POLICY === 'ANTI_AFFINED'
  )

  const renderRoles = (roleList) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'wrap',
        gap: 0.5,
      }}
    >
      {roleList.map((role, index) => {
        if (!role?.ID || !role?.NAME) return null

        const tooltipContent = (
          <div>
            <div>ID: {role.ID}</div>
            <div>
              {T.Name}: {role.NAME}
            </div>
            {role.HOST_AFFINED && (
              <div>
                {T.HostAffined}: {role.HOST_AFFINED}
              </div>
            )}
            {role.HOST_ANTI_AFFINED && (
              <div>
                {T.HostAntiAffined}: {role.HOST_ANTI_AFFINED}
              </div>
            )}
          </div>
        )

        return (
          <Tooltip
            key={index}
            title={tooltipContent}
            arrow
            placement={role?.POLICY === 'AFFINED' ? 'left' : 'right'}
          >
            <Chip
              sx={{
                margin: 0.5,
                opacity: 0.8,
                maxWidth: 375,
                '& .MuiChip-label': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                },
              }}
              label={role.NAME}
            />
          </Tooltip>
        )
      })}
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexGrow: 1 }}>
      <Accordion
        square={true}
        onClick={(e) => e.stopPropagation()}
        elevation={1}
        disabled={affinedRoles?.length <= 0}
        sx={{
          mr: 1,
          overflow: 'hidden',
          borderRadius: '0 0 0.5rem 0.5rem',
          '&:not(.Mui-expanded)': {
            maxHeight: '48px',
          },
          '&.Mui-expanded': {
            maxHeight: 'none',
          },
          '.MuiAccordionSummary-root': {
            borderRadius: '0 0 0.5rem 0.5rem',
            '&:hover': {
              borderRadius: '0 0 0.5rem 0.5rem',
            },
          },
        }}
      >
        <AccordionSummary>
          <Typography variant="caption">Affined Roles</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ overflow: 'hidden' }}>
          {renderRoles(affinedRoles)}
        </AccordionDetails>
      </Accordion>
      <Accordion
        square={true}
        onClick={(e) => e.stopPropagation()}
        elevation={1}
        disabled={antiAffinedRoles?.length <= 0}
        sx={{
          mr: 1,
          borderRadius: '0 0 0.5rem 0.5rem',
          '&:not(.Mui-expanded)': {
            maxHeight: '48px',
          },
          '&.Mui-expanded': {
            maxHeight: 'none',
          },
          '.MuiAccordionSummary-root': {
            borderRadius: '0 0 0.5rem 0.5rem',
            '&:hover': {
              borderRadius: '0 0 0.5rem 0.5rem',
            },
          },
        }}
      >
        <AccordionSummary>
          <Typography variant="caption">Anti-Affined Roles</Typography>
        </AccordionSummary>
        <AccordionDetails>{renderRoles(antiAffinedRoles)}</AccordionDetails>
      </Accordion>
    </Box>
  )
}

RolesComponent.propTypes = {
  roles: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.shape({
        POLICY: PropTypes.string.isRequired,
        NAME: PropTypes.string.isRequired,
        ID: PropTypes.string.isRequired,
      })
    ),
    PropTypes.object,
  ]).isRequired,
}

VmGroupCard.propTypes = {
  vmgroup: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired,
    GNAME: PropTypes.string.isRequired,
    LOCK: PropTypes.object,
    ROLES: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
  }),
  rootProps: PropTypes.object,
}

VmGroupCard.displayName = 'VmGroupCard'

export default VmGroupCard
