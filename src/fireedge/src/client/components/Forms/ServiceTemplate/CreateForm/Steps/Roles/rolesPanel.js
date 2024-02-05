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
import { Component } from 'react'
import PropTypes from 'prop-types'
import { Box, TextField, Typography } from '@mui/material'
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
  const handleInputChange = (event, passedName = '') => {
    let value
    let name = passedName
    if (typeof event === 'object' && event?.target) {
      const { name: eventName = '', value: eventValue = '' } =
        event.target || {}
      value = eventValue
      name = passedName || eventName
    } else {
      value = event
    }
    onChange({ ...roles[selectedRoleIndex], [name]: value }) // updated role
  }

  return (
    <Box p={2}>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6">Role Details</Typography>
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Role Name"
            name="NAME"
            value={roles?.[selectedRoleIndex]?.NAME ?? ''}
            onChange={handleInputChange}
            disabled={!roles?.[selectedRoleIndex]}
            inputProps={{ 'data-cy': `role-name-${selectedRoleIndex}` }}
            fullWidth
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <TextField
            type="number"
            label={T.NumberOfVms}
            value={roles?.[selectedRoleIndex]?.CARDINALITY ?? 1}
            onChange={handleInputChange}
            name="CARDINALITY"
            InputProps={{
              inputProps: {
                min: 0,
                'data-cy': `role-cardinality-${selectedRoleIndex}`,
              },
            }}
            fullWidth
          />
        </Box>
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
