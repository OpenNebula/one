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
import {
  Box,
  TextField,
  Select,
  MenuItem,
  Typography,
  FormControl,
  InputLabel,
} from '@mui/material'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

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
  const handleRoleChange = useCallback(
    (updatedRole) => {
      const updatedRoles = [...roles]
      updatedRoles[selectedRoleIndex] = updatedRole
      onChange(updatedRoles)
    },
    [roles, onChange, selectedRoleIndex]
  )

  const handleInputChange = (event) => {
    const { name, value } = event.target
    handleRoleChange({ ...roles[selectedRoleIndex], [name]: value })
  }

  return (
    <Box p={2}>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6">{Tr(T.RoleDetails)}</Typography>
        <Box sx={{ mb: 2 }}>
          <TextField
            label={Tr(T.RoleName)}
            name="NAME"
            value={roles?.[selectedRoleIndex]?.NAME ?? ''}
            onChange={handleInputChange}
            disabled={!roles?.[selectedRoleIndex]}
            inputProps={{ 'data-cy': `role-name-${selectedRoleIndex}` }}
            fullWidth
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth variant="outlined" sx={{ mt: 2 }}>
            <InputLabel>VM-VM Affinity</InputLabel>
            <Select
              label={Tr(T.VMAffinity)}
              name="POLICY"
              data-cy="policy-selector"
              value={roles?.[selectedRoleIndex]?.POLICY ?? 'None'}
              disabled={!roles?.[selectedRoleIndex]}
              onChange={handleInputChange}
            >
              <MenuItem data-cy="policy-selector-policy-None" value="None">
                {Tr(T.None)}
              </MenuItem>
              <MenuItem
                data-cy="policy-selector-policy-AFFINED"
                value="AFFINED"
              >
                {Tr(T.Affined)}
              </MenuItem>
              <MenuItem
                data-cy="policy-selector-policy-ANTI_AFFINED"
                value="ANTI_AFFINED"
              >
                {Tr(T.AntiAffined)}
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
    </Box>
  )
}

RoleVmVmPanel.propTypes = {
  roles: PropTypes.arrayOf(
    PropTypes.shape({
      NAME: PropTypes.string,
      POLICY: PropTypes.oneOf([undefined, 'None', 'AFFINED', 'ANTI_AFFINED']),
    })
  ),
  onChange: PropTypes.func.isRequired,
  selectedRoleIndex: PropTypes.number,
}

export default RoleVmVmPanel
