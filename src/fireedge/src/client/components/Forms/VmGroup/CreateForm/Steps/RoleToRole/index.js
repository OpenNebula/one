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
import { useFormContext } from 'react-hook-form'
import { useState } from 'react'
import { SCHEMA } from './schema'
import RoleAffinityPanel from './affinityPanel'
export const STEP_ID = 'role-to-role'

const Content = () => {
  const { getValues, setValue } = useFormContext()
  const { AFFINED_GROUPS, ANTI_AFFINED_GROUPS } = getValues(STEP_ID)
  const [affinedGroups, setAffinedGroups] = useState(AFFINED_GROUPS ?? [])
  const [antiAffinedGroups, setAntiAffinedGroups] = useState(
    ANTI_AFFINED_GROUPS ?? []
  )
  const definedRoles = getValues('role-definition')
  const handleGroupsChange = (newAffinedGroups, newAntiAffinedGroups) => {
    setAffinedGroups(newAffinedGroups?.filter((group) => group?.length >= 2))
    setAntiAffinedGroups(
      newAntiAffinedGroups?.filter((group) => group?.length >= 2)
    )

    setValue(STEP_ID, {
      AFFINED_GROUPS: newAffinedGroups,
      ANTI_AFFINED_GROUPS: newAntiAffinedGroups,
    })
  }

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
