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
import PropTypes from 'prop-types'
import { useState, Component, useLayoutEffect } from 'react'
import {
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Box,
} from '@mui/material'
import { Group } from 'iconoir-react'
import { AffinityGroup } from './affinityGroup'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * Role Affinity Panel component for managing roles.
 *
 * @param {object} props - The props object
 * @param {Array} props.roles - The list of roles
 * @param {Array} props.affinedGroups - Shared list of affined groups
 * @param {Array} props.antiAffinedGroups - Shared list of anti-affined groups
 * @param {Function} props.onGroupsChange - Callback handler for setting form group values
 * @returns {Component} The rendered component.
 */
const RoleAffinityPanel = ({
  roles,
  affinedGroups,
  antiAffinedGroups,
  onGroupsChange,
}) => {
  const [affinityType, setAffinityType] = useState('AFFINED')
  const [selectedRoles, setSelectedRoles] = useState([])

  const handleAffinityTypeChange = (_event, newAffinityType) => {
    if (newAffinityType !== null) {
      setAffinityType(newAffinityType)
      setSelectedRoles([])
    }
  }
  const handleRoleSelect = (role) => {
    setSelectedRoles((prevSelectedRoles) => {
      const isSelected = prevSelectedRoles.includes(role)

      return isSelected
        ? prevSelectedRoles.filter((r) => r !== role)
        : [...prevSelectedRoles, role]
    })
  }

  const handleAddGroup = () => {
    const newGroup = [...selectedRoles]
    if (affinityType === 'AFFINED') {
      const newAffinedGroups = [...affinedGroups, newGroup]
      onGroupsChange(newAffinedGroups, antiAffinedGroups)
    } else {
      const newAntiAffinedGroups = [...antiAffinedGroups, newGroup]
      onGroupsChange(affinedGroups, newAntiAffinedGroups)
    }
    setSelectedRoles([])
  }

  const handleDeleteGroup = (groupIndex, type) => {
    if (type === 'AFFINED') {
      const newAffinedGroups = affinedGroups.filter(
        (_, index) => index !== groupIndex
      )
      onGroupsChange(newAffinedGroups, antiAffinedGroups)
    } else {
      const newAntiAffinedGroups = antiAffinedGroups.filter(
        (_, index) => index !== groupIndex
      )
      onGroupsChange(affinedGroups, newAntiAffinedGroups)
    }
  }

  const handleDeleteRoleFromGroup = (roleIndex, groupIndex, type) => {
    const updateGroup = (groups) =>
      groups.map((group, index) => {
        if (index === groupIndex) {
          const updatedGroup = group.filter((_, idx) => idx !== roleIndex)

          return updatedGroup
        }

        return group
      })

    if (type === 'AFFINED') {
      const newAffinedGroups = updateGroup(affinedGroups)
      newAffinedGroups?.[groupIndex]?.length < 2
        ? handleDeleteGroup(groupIndex, type)
        : onGroupsChange(newAffinedGroups, antiAffinedGroups)
    } else {
      const newAntiAffinedGroups = updateGroup(antiAffinedGroups)
      newAntiAffinedGroups?.[groupIndex]?.length < 2
        ? handleDeleteGroup(groupIndex, type)
        : onGroupsChange(affinedGroups, newAntiAffinedGroups)
    }
  }

  const filteredRoles = roles.filter(
    (role) => role.POLICY === affinityType || role.POLICY === 'None'
  )

  const filterGroupsByPolicy = (groups, policy) => {
    const roleLookup = Object.fromEntries(
      roles.map((role) => [role.NAME, role.POLICY])
    )

    return groups?.map((group) =>
      group?.filter((role) => ['None', policy].includes(roleLookup[role]))
    )
  }

  useLayoutEffect(() => {
    const filteredAffinedGroups = filterGroupsByPolicy(affinedGroups, 'AFFINED')
    const filteredAntiAffinedGroups = filterGroupsByPolicy(
      antiAffinedGroups,
      'ANTI_AFFINED'
    )

    onGroupsChange(filteredAffinedGroups, filteredAntiAffinedGroups)
  }, [])

  return (
    <Grid container mt={2} columnSpacing={2} sx={{ maxHeight: '400px' }}>
      <Grid item xs={12} md={3}>
        <Card
          variant="outlined"
          sx={{
            height: '100%',
            maxHeight: '600px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <CardContent sx={{ flex: '1 0 auto', overflow: 'hidden' }}>
            <ToggleButtonGroup
              value={affinityType}
              exclusive
              onChange={handleAffinityTypeChange}
              fullWidth
            >
              <ToggleButton data-cy="policy-AFFINED" value="AFFINED">
                {Tr(T.Affined)}
              </ToggleButton>
              <ToggleButton data-cy="policy-ANTI_AFFINED" value="ANTI_AFFINED">
                {Tr(T.AntiAffined)}
              </ToggleButton>
            </ToggleButtonGroup>
            <List
              dense
              sx={{
                mt: 2,
                overflow: 'hidden',
                bgcolor: 'background.paper',
                height: '100%',
                maxHeight: '400px',
                minHeight: '400px',
              }}
            >
              {filteredRoles.map((role, index) => (
                <ListItem
                  key={role.id || index}
                  button
                  onClick={() => handleRoleSelect(role?.NAME)}
                  data-cy={`role-${role?.NAME}`}
                  sx={{
                    py: 1,
                    my: 0.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '4px',
                  }}
                >
                  <Checkbox checked={selectedRoles.includes(role.NAME)} />
                  <ListItemText
                    primary={role.NAME}
                    primaryTypographyProps={{
                      noWrap: true,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block',
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
          <CardActions>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Group />}
              disabled={selectedRoles.length < 2}
              data-cy="add-group"
              onClick={handleAddGroup}
              size="large"
              fullWidth
            >
              {Tr(T.AddGroup)}
            </Button>
          </CardActions>
        </Card>
      </Grid>
      <Grid item xs={12} md={9}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  component="div"
                  sx={{
                    textAlign: 'center',
                    color: affinedGroups.length ? 'inherit' : 'text.disabled',
                  }}
                >
                  {Tr(T.AffinedGroups)}
                </Typography>
                <Box maxHeight={'500px'} minHeight={'500px'} overflow={'auto'}>
                  <AffinityGroup
                    groupType="AFFINED"
                    groups={affinedGroups}
                    onDeleteGroup={handleDeleteGroup}
                    onDeleteRole={handleDeleteRoleFromGroup}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} sx={{ maxHeight: '600px' }}>
            <Card variant="outlined">
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  component="div"
                  sx={{
                    textAlign: 'center',
                    color: antiAffinedGroups.length
                      ? 'inherit'
                      : 'text.disabled',
                  }}
                >
                  {Tr(T.AntiAffinedGroups)}
                </Typography>
                <Box maxHeight={'500px'} minHeight={'500px'} overflow={'auto'}>
                  <AffinityGroup
                    groupType="ANTI_AFFINED"
                    groups={antiAffinedGroups}
                    onDeleteGroup={handleDeleteGroup}
                    onDeleteRole={handleDeleteRoleFromGroup}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

RoleAffinityPanel.propTypes = {
  roles: PropTypes.arrayOf(
    PropTypes.shape({
      NAME: PropTypes.string.isRequired,
      POLICY: PropTypes.string.isRequired,
    })
  ).isRequired,
  affinedGroups: PropTypes.array.isRequired,
  antiAffinedGroups: PropTypes.array.isRequired,
  onGroupsChange: PropTypes.func.isRequired,
}

RoleAffinityPanel.defaultProps = {
  roles: [],
}

export default RoleAffinityPanel
