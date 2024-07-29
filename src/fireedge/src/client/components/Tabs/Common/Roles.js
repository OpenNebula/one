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
import makeStyles from '@mui/styles/makeStyles'
import { Tr, Translate } from 'client/components/HOC'
import { PrettyVmGroupRole, T } from 'client/constants'
import PropTypes from 'prop-types'
import { ReactElement, memo, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { Box, List, ListItem, Paper, Typography, styled } from '@mui/material'

const Title = styled(ListItem)(({ theme }) => ({
  fontWeight: theme.typography.fontWeightBold,
  borderBottom: `1px solid ${theme.palette.divider}`,
}))

const Item = styled(ListItem)(({ theme }) => ({
  gap: '1em',
  '& > *': {
    flex: '1 1 50%',
    overflow: 'hidden',
    minHeight: '100%',
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}))

const useStyles = makeStyles({
  container: {
    gridColumn: '1 / -1',
  },
  item: {
    '& > *:first-child': {
      flex: '1 1 20%',
    },
  },
})

const RolesVmGroupsTable = memo(({ title, roles }) => {
  const classes = useStyles()

  return (
    <Paper className={classes.container} variant="outlined">
      <List variant="outlined">
        {title && (
          <Title>
            {typeof title === 'string' ? (
              <Typography noWrap>{Tr(title)}</Typography>
            ) : (
              title
            )}
          </Title>
        )}
        <Item>
          <VmGroupRoles
            parentKey={''}
            roles={Array.isArray(roles) ? roles : [roles]}
          />
        </Item>
      </List>
    </Paper>
  )
})

RolesVmGroupsTable.propTypes = {
  title: PropTypes.any,
  roles: PropTypes.arrayOf(
    PropTypes.shape({
      ID: PropTypes.string,
      NAME: PropTypes.string,
      HOST_AFFINITY: PropTypes.string,
      HOST_ANTI_AFFINED: PropTypes.string,
      POLICY: PropTypes.string,
    })
  ),
}

RolesVmGroupsTable.displayName = 'RolesVmGroupsTable'

export const VmGroupRoles = memo(({ parentKey = '', roles }) => {
  const COLUMNS = useMemo(
    () => [T.Name, T.HostAffined, T.HostAntiAffined, T.VmAffinity],
    []
  )

  return (
    <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap="0.5em">
      {COLUMNS.map((col) => (
        <Typography
          key={`${parentKey}-${col}`}
          noWrap
          component="span"
          variant="subtitle2"
        >
          <Translate word={col} />
        </Typography>
      ))}
      {roles.map((role) => (
        <VmGroupRole
          key={uuidv4()}
          data-cy={`${parentKey}-role-${role?.RULE_TYPE}`}
          role={role}
        />
      ))}
    </Box>
  )
})

VmGroupRoles.propTypes = {
  parentKey: PropTypes.string,
  id: PropTypes.string,
  roles: PropTypes.array,
  actions: PropTypes.node,
}

VmGroupRoles.displayName = 'VmGroupRole'

export const VmGroupRole = memo(({ role = {}, 'data-cy': parentCy }) => {
  /** @type {PrettyVmGroupRole} */
  const {
    NAME = '',
    HOST_AFFINED = '',
    HOST_ANTI_AFFINED = '',
    POLICY = '',
  } = role

  /**
   * @param {object} role - role.
   * @param {string} role.text - role text
   * @param {string} role.dataCy - role data-cy
   * @returns {ReactElement} role line
   */
  const renderLine = ({ text, dataCy }) => (
    <Typography
      noWrap
      key={`${parentCy}-${dataCy}`}
      data-cy={`${parentCy}-${dataCy}`.toLowerCase()}
      variant="subtitle2"
    >
      {text}
    </Typography>
  )

  /**
   * @param {string} policy - Policy identifier.
   * @returns {string} formatted policy identifier.
   */
  const formatPolicy = (policy) => policy.split('_').join(' ').toUpperCase()

  return (
    <>
      {[
        { text: String(NAME), dataCy: 'name' },
        { text: String(HOST_AFFINED), dataCy: 'hostaffinity' },
        {
          text: String(HOST_ANTI_AFFINED),
          dataCy: 'hostantiaffinity',
        },

        { text: String(formatPolicy(POLICY)), dataCy: 'vmaffinity' },
      ].map(renderLine)}
    </>
  )
})

VmGroupRole.propTypes = {
  role: PropTypes.object,
  'data-cy': PropTypes.string,
}

VmGroupRole.displayName = 'VmGroupRole'

export default RolesVmGroupsTable
