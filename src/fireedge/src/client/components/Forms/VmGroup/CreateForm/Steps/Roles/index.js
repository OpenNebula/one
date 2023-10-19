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
import { useState, useCallback, useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Box, Grid } from '@mui/material'
import { SCHEMA } from './schema'
import RoleVmVmPanel from './rolesPanel'
import RoleColumn from './rolesColumn'
import HostAffinityPanel from './hostAffinityPanel'
import RoleSummary from './roleSummary'

export const STEP_ID = 'role-definition'

const Content = () => {
  const { getValues, setValue, reset } = useFormContext()
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0)
  const defaultRole = [{ NAME: '', POLICY: 'None' }]
  const watchedRoles = useWatch({
    name: STEP_ID,
    defaultValue: defaultRole,
  })
  const definedRoles = getValues(STEP_ID)
  useEffect(() => {
    if (definedRoles) {
      reset({ [STEP_ID]: definedRoles ?? defaultRole })
    }
  }, []) // Set the form initial values
  const [roles, setRoles] = useState(getValues(STEP_ID))

  useEffect(() => {
    setRoles(watchedRoles)
  }, [definedRoles, watchedRoles])
  const handleChangeRoles = (updatedRoles) => {
    setValue(STEP_ID, updatedRoles)
  }

  const handleHostAffinityChange = useCallback(
    (affinityKey, hostIds) => {
      const updatedRoles = [...roles]
      const existingHostIds =
        updatedRoles?.[selectedRoleIndex]?.[affinityKey] || []

      const combinedHostIds = Array.from(
        new Set([...existingHostIds, ...hostIds])
      )

      updatedRoles[selectedRoleIndex] = {
        ...updatedRoles[selectedRoleIndex],
        [affinityKey]: combinedHostIds,
      }

      handleChangeRoles(updatedRoles)
    },
    [roles, selectedRoleIndex, handleChangeRoles]
  )

  const handleRemoveAffinity = (affinityType, hostId) => {
    const updatedRoles = [...roles]
    const updatedRole = { ...updatedRoles[selectedRoleIndex] }
    updatedRole[affinityType] = updatedRole[affinityType].filter(
      (id) => id !== hostId
    )
    updatedRoles[selectedRoleIndex] = updatedRole
    handleChangeRoles(updatedRoles)
  }

  return (
    <Grid mt={2} container>
      <Grid item xs={2.2}>
        <RoleColumn
          roles={roles}
          onChange={handleChangeRoles}
          selectedRoleIndex={selectedRoleIndex}
          setSelectedRoleIndex={setSelectedRoleIndex}
        />
      </Grid>
      <Grid item xs={7}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1em',
            overflow: 'auto',
          }}
        >
          <RoleVmVmPanel
            roles={roles}
            onChange={handleChangeRoles}
            selectedRoleIndex={selectedRoleIndex}
          />
          <HostAffinityPanel
            roles={roles}
            selectedRoleIndex={selectedRoleIndex}
            onChange={handleHostAffinityChange}
          />
        </Box>
      </Grid>
      <Grid item xs={2.8}>
        <RoleSummary
          role={roles?.[selectedRoleIndex] ?? []}
          selectedRoleIndex={selectedRoleIndex}
          onRemoveAffinity={handleRemoveAffinity}
        />
      </Grid>
    </Grid>
  )
}

/**
 * Role definition configuration.
 *
 * @returns {object} Roles definition configuration step
 */
const RoleDefinition = () => ({
  id: STEP_ID,
  label: 'Role Definition',
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
})
RoleDefinition.propTypes = {
  data: PropTypes.array,
  setFormData: PropTypes.func,
}

export default RoleDefinition
