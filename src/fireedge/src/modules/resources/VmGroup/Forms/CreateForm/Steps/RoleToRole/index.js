/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { useCallback } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { SCHEMA } from './schema'
import RoleAffinityPanel from './affinityPanel'
export const STEP_ID = 'role-to-role'
const ROLE_DEFINITION_ID = 'role-definition'

const normalizeGroups = (groups = []) =>
  groups?.filter((group) => group?.length >= 2) ?? []

const Content = () => {
  const { control, setValue } = useFormContext()
  const roleToRole = useWatch({ control, name: STEP_ID }) ?? {}
  const definedRoles = useWatch({ control, name: ROLE_DEFINITION_ID }) ?? []
  const affinedGroups = roleToRole?.AFFINED_GROUPS ?? []
  const antiAffinedGroups = roleToRole?.ANTI_AFFINED_GROUPS ?? []

  const handleGroupsChange = useCallback(
    (newAffinedGroups = [], newAntiAffinedGroups = []) => {
      setValue(
        STEP_ID,
        {
          AFFINED_GROUPS: normalizeGroups(newAffinedGroups),
          ANTI_AFFINED_GROUPS: normalizeGroups(newAntiAffinedGroups),
        },
        { shouldDirty: true, shouldValidate: true }
      )
    },
    [setValue]
  )

  return (
    <RoleAffinityPanel
      roles={definedRoles}
      affinedGroups={affinedGroups}
      antiAffinedGroups={antiAffinedGroups}
      onGroupsChange={handleGroupsChange}
    />
  )
}

/**
 * Role to role definition configuration.
 *
 * @returns {object} Role to role configuration step
 */
const RoleToRole = () => ({
  id: STEP_ID,
  label: 'Role affinity',
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
})

RoleToRole.propTypes = {
  data: PropTypes.array,
  setFormData: PropTypes.func,
}

export default RoleToRole
