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
import Component from 'react'
import {
  Box,
  TextField,
  Typography,
  Checkbox,
  Autocomplete,
} from '@mui/material'
import PropTypes from 'prop-types'
import { T } from 'client/constants'
import { Tr } from 'client/components/HOC'

/**
 * Role Panel component for managing roles.
 *
 * @param {object} props - Component properties.
 * @param {Array} props.roles - List of roles.
 * @param {Function} props.onChange - Callback for when roles change.
 * @param {number} props.selectedRoleIndex - Currently selected role index.
 * @returns {Component} The rendered component.
 */
const RoleVmVmPanel = ({ roles, onChange, selectedRoleIndex }) => {
  const handleInputChange = (name, value) => {
    const updatedRole = { ...roles[selectedRoleIndex], [name]: value }
    onChange(updatedRole)
  }

  const handleTextFieldChange = (event, number = false) => {
    const { name, value } = event.target
    handleInputChange(name, number ? parseInt(value, 10) : value)
  }

  const handleAutocompleteChange = (event, value) => {
    const parentNames = value.map((option) => option.NAME)
    handleInputChange('PARENTS', parentNames)
  }

  const isDisabled = !roles?.[selectedRoleIndex] || roles?.length <= 0
  const selectedRole = roles?.[selectedRoleIndex] || {}

  const selectedParentRoles = roles?.filter((role) =>
    selectedRole?.PARENTS?.includes(role?.NAME)
  )

  return (
    <Box p={2}>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6">{Tr(T.RoleDetails)}</Typography>
        <Box sx={{ mb: 2 }}>
          <TextField
            label={Tr(T.RoleName)}
            name="NAME"
            value={selectedRole?.NAME || ''}
            onChange={handleTextFieldChange}
            disabled={isDisabled}
            inputProps={{ 'data-cy': `role-name-${selectedRoleIndex}` }}
            fullWidth
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <TextField
            type="number"
            label={Tr(T.NumberOfVms)}
            name="CARDINALITY"
            value={selectedRole?.CARDINALITY || 0}
            onChange={(event) => handleTextFieldChange(event, true)}
            disabled={isDisabled}
            InputProps={{
              inputProps: {
                min: 0,
                'data-cy': `role-cardinality-${selectedRoleIndex}`,
              },
            }}
            fullWidth
          />
        </Box>

        {roles?.length >= 2 && (
          <Box sx={{ mb: 2 }}>
            <Autocomplete
              multiple
              options={roles?.filter((_, idx) => idx !== selectedRoleIndex)}
              disableCloseOnSelect
              getOptionLabel={(option) => option?.NAME}
              value={selectedParentRoles}
              onChange={handleAutocompleteChange}
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  <Checkbox style={{ marginRight: 8 }} checked={selected} />
                  {option?.NAME}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="PARENTS"
                  placeholder={Tr(T.ParentRoles)}
                />
              )}
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}

RoleVmVmPanel.propTypes = {
  roles: PropTypes.arrayOf(
    PropTypes.shape({
      NAME: PropTypes.string,
      CARDINALITY: PropTypes.number,
    })
  ),
  onChange: PropTypes.func.isRequired,
  selectedRoleIndex: PropTypes.number,
}

export default RoleVmVmPanel
