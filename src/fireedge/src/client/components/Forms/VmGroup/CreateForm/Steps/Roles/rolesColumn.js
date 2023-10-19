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
import { useCallback, Component } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, List, ListItem, IconButton } from '@mui/material'
import { Cancel } from 'iconoir-react'

/**
 * RoleColumn component for displaying and managing roles.
 *
 * @param {object} props - The properties passed to the component.
 * @param {Array} props.roles - The list of roles.
 * @param {Function} props.onChange - Callback function when roles are changed.
 * @param {number|null} props.selectedRoleIndex - The index of the currently selected role.
 * @param {Function} props.setSelectedRoleIndex - Function to set the selected role index.
 * @returns {Component} - Role columns component
 */
const RoleColumn = ({
  roles,
  onChange,
  selectedRoleIndex,
  setSelectedRoleIndex,
}) => {
  const handleAddRole = useCallback(() => {
    const newRole = { NAME: '', POLICY: 'None' }
    onChange([...roles, newRole])
    setSelectedRoleIndex(roles.length)
  }, [roles, onChange])

  const handleRemoveRole = useCallback(
    (indexToRemove) => {
      const updatedRoles = roles.filter((_, index) => index !== indexToRemove)
      onChange(updatedRoles)
      if (selectedRoleIndex === indexToRemove) {
        setSelectedRoleIndex(null)
      }
    },
    [roles, onChange, selectedRoleIndex]
  )

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        pt: 2,
        height: '100%',
        maxHeight: '630px',
      }}
    >
      <Box
        sx={{
          borderRight: 1,
          pr: 2,
          width: '100%',
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddRole}
          size="large"
          data-cy="add-role"
        >
          Add Role
        </Button>
        <Box
          sx={{
            maxHeight: '90%',
            overflowY: 'auto',
          }}
        >
          <List>
            {Array.isArray(roles) &&
              roles.length > 0 &&
              roles.map((role, index) => (
                <ListItem
                  button
                  selected={index === selectedRoleIndex}
                  onClick={() => setSelectedRoleIndex(index)}
                  key={index}
                  sx={{
                    my: 0.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '4px',
                    overflowX: 'hidden',
                    bgcolor:
                      index === selectedRoleIndex
                        ? 'action.selected'
                        : 'inherit',
                    '&.Mui-selected, &.Mui-selected:hover': {
                      bgcolor: 'action.selected',
                    },
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <IconButton
                    aria-label="delete"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleRemoveRole(index)
                    }}
                    data-cy={`delete-role-${index}`}
                    sx={{ mr: 1.5 }}
                  >
                    <Cancel />
                  </IconButton>
                  <div
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {role?.NAME || 'New Role'}
                  </div>
                </ListItem>
              ))}
          </List>
        </Box>
      </Box>
    </Box>
  )
}

RoleColumn.propTypes = {
  roles: PropTypes.arrayOf(PropTypes.object).isRequired,
  onChange: PropTypes.func.isRequired,
  selectedRoleIndex: PropTypes.number,
  setSelectedRoleIndex: PropTypes.func.isRequired,
}

RoleColumn.defaultProps = {
  roles: [],
}

export default RoleColumn
