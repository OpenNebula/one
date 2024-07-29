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
import { useState, useCallback, useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Box, Grid } from '@mui/material'
import { SCHEMA } from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/Roles/schema'
import RoleVmVmPanel from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/Roles/rolesPanel'
import RoleColumn from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/Roles/rolesColumn'
import VmTemplatesPanel from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/Roles/vmTemplatesPanel'
import RoleSummary from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/Roles/roleSummary'
import { T } from 'client/constants'

export const STEP_ID = 'roledefinition'

const Content = () => {
  const { getValues, setValue, reset } = useFormContext()
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0)

  const defaultRole = [
    { NAME: '', SELECTED_VM_TEMPLATE_ID: [], CARDINALITY: 0 },
  ]

  const watchedRoles = useWatch({
    name: STEP_ID,
    defaultValue: defaultRole,
  })
  const definedRoles = getValues(STEP_ID)

  useEffect(() => {
    if (definedRoles) {
      reset({ [STEP_ID]: definedRoles ?? defaultRole })
    }
  }, [])

  const [roles, setRoles] = useState(getValues(STEP_ID))

  useEffect(() => {
    setRoles(watchedRoles)
  }, [definedRoles, watchedRoles])

  const handleChangeRoles = (updatedRoles) => {
    setValue(STEP_ID, updatedRoles)
  }

  const handleRoleChange = useCallback(
    (updatedRole) => {
      const updatedRoles = [...roles]

      if (selectedRoleIndex >= 0 && selectedRoleIndex < roles.length) {
        updatedRoles[selectedRoleIndex] = updatedRole
      } else {
        updatedRoles.push(updatedRole)
      }

      handleChangeRoles(updatedRoles)
    },
    [roles, selectedRoleIndex]
  )

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
            onChange={handleRoleChange}
            selectedRoleIndex={selectedRoleIndex}
          />
          <VmTemplatesPanel
            roles={roles}
            selectedRoleIndex={selectedRoleIndex}
            onChange={handleRoleChange}
          />
        </Box>
      </Grid>
      <Grid item xs={2.8}>
        <RoleSummary
          role={roles?.[selectedRoleIndex] ?? []}
          selectedRoleIndex={selectedRoleIndex}
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
  label: T.RoleDefinition,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
})
RoleDefinition.propTypes = {
  data: PropTypes.array,
  setFormData: PropTypes.func,
}

export default RoleDefinition
