/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { css } from '@emotion/css'
import {
  useTheme,
  Box,
  List,
  ListItem,
  Paper,
  Typography,
  styled,
} from '@mui/material'
import { Tr, Translate } from '@modules/components/HOC'
import { T } from '@ConstantsModule'
import PropTypes from 'prop-types'
import { ReactElement, memo, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'

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

const useStyles = () => ({
  container: css({
    gridColumn: '1 / -1',
  }),
  item: css({
    '& > *:first-child': {
      flex: '1 1 20%',
    },
  }),
})

const RolesAffinityVmGroupsTable = memo(({ title, roles = [] }) => {
  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])

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
          <VmGroupAffinityRoles
            parentKey={''}
            roles={Array.isArray(roles) ? roles : [roles]}
          />
        </Item>
      </List>
    </Paper>
  )
})

RolesAffinityVmGroupsTable.propTypes = {
  title: PropTypes.any,
  roles: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.shape({
        AFFINED: PropTypes.string,
        ANTI_AFFINED: PropTypes.string,
      })
    ),
    PropTypes.object,
  ]),
}

RolesAffinityVmGroupsTable.displayName = 'RolesAffinityVmGroupsTable'

export const VmGroupAffinityRoles = memo(({ parentKey = '', roles }) => {
  const COLUMNS = useMemo(() => [T.Roles, T.VmAffinity], [])
  const groupTypes = ['AFFINED', 'ANTI_AFFINED']

  return (
    <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap="0.5em">
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
      {groupTypes?.map((TYPE, index) => (
        <VmGroupAffinityRole
          key={uuidv4()}
          data-cy={`${parentKey}-role-${groupTypes?.[index]}`}
          role={{ [TYPE]: roles?.[0]?.[TYPE] ?? [] }}
        />
      ))}
    </Box>
  )
})

VmGroupAffinityRoles.propTypes = {
  parentKey: PropTypes.string,
  id: PropTypes.string,
  roles: PropTypes.array,
  actions: PropTypes.node,
}

VmGroupAffinityRoles.displayName = 'VmGroupAffinityRole'

export const VmGroupAffinityRole = memo(
  ({ role = {}, 'data-cy': parentCy }) => {
    /**
     * @param {object} item - item.
     * @param {string} item.text - item text
     * @param {string} item.dataCy - item data-cy
     * @returns {ReactElement} item line
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
    const formatPolicy = (policy) => policy.split('_').join(' ')

    return (
      <>
        {Object.entries(role).flatMap(([TYPE, ROLES]) => {
          const groups = Array.isArray(ROLES) ? ROLES : [ROLES]

          return groups.map((group, groupIndex) => [
            renderLine({
              text: group,
              dataCy: `${TYPE.toLowerCase()}-${groupIndex}-group`,
            }),
            renderLine({
              text: formatPolicy(TYPE),
              dataCy: `${TYPE.toLowerCase()}-${groupIndex}-type`,
            }),
          ])
        })}
      </>
    )
  }
)

VmGroupAffinityRole.propTypes = {
  role: PropTypes.object,
  'data-cy': PropTypes.string,
}

VmGroupAffinityRole.displayName = 'VmGroupAffinityRole'

export default RolesAffinityVmGroupsTable
