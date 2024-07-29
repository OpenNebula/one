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
import { useCallback, Component } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, List, ListItem, IconButton } from '@mui/material'
import { Cancel } from 'iconoir-react'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * RoleColumn component for displaying and managing roles.
 *
 * @param {object} props - The properties passed to the component.
 * @param {Array} props.roles - The list of roles.
 * @param {Function} props.onChange - Callback function when roles are changed.
 * @param {number|null} props.selectedRoleIndex - The index of the currently selected role.
 * @param {Function} props.setSelectedRoleIndex - Function to set the selected role index.
 * @param {boolean} props.disableModify - Disables the modification of roles.
 * @returns {Component} - Role columns component
 */
const RoleColumn = ({
  roles,
  onChange,
  selectedRoleIndex,
  setSelectedRoleIndex,
  disableModify = false,
}) => {
  const newRole = { NAME: '', SELECTED_VM_TEMPLATE_ID: [], CARDINALITY: 0 }

  const handleAddRole = useCallback(() => {
    const updatedRoles = [...roles, newRole]
    onChange(updatedRoles)
    setSelectedRoleIndex(roles?.length)
  }, [roles, onChange, selectedRoleIndex])

  const handleRemoveRole = useCallback(
    (indexToRemove) => {
      const updatedRoles = [
        ...roles.slice(0, indexToRemove),
        ...roles.slice(indexToRemove + 1),
      ]

      onChange(updatedRoles)
      if (selectedRoleIndex === indexToRemove) {
        setSelectedRoleIndex(null)
      }
    },
    [roles, selectedRoleIndex]
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
        {!disableModify && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddRole}
            size="large"
            data-cy="add-role"
          >
            {Tr(T.AddRole)}
          </Button>
        )}
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
                    minHeight: '43.5px',
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
                  data-cy={`role-column-${index}`}
                >
                  {!disableModify && (
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
                  )}
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
  disableModify: PropTypes.bool,
}

RoleColumn.defaultProps = {
  roles: [],
}

export default RoleColumn
