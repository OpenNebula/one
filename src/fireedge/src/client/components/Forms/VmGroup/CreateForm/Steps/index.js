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
import General, {
  STEP_ID as GENERAL_ID,
} from 'client/components/Forms/VmGroup/CreateForm/Steps/General'
import RoleDefinition, {
  STEP_ID as ROLE_DEFINITION_ID,
} from 'client/components/Forms/VmGroup/CreateForm/Steps/Roles'
import RoleToRole, {
  STEP_ID as ROLE_TO_ROLE_ID,
} from 'client/components/Forms/VmGroup/CreateForm/Steps/RoleToRole'

import { createSteps } from 'client/utils'

const Steps = createSteps([General, RoleDefinition, RoleToRole], {
  transformInitialValue: (VmGroupTemplate, schema) => {
    const accessor = VmGroupTemplate?.TEMPLATE
    const affinedGroups = Array.isArray(accessor?.AFFINED)
      ? accessor?.AFFINED
      : [accessor?.AFFINED]
    const antiAffinedGroups = Array.isArray(accessor?.ANTI_AFFINED)
      ? accessor?.ANTI_AFFINED
      : [accessor?.ANTI_AFFINED]
    const definedRoles = Array.isArray(VmGroupTemplate?.ROLES?.ROLE)
      ? VmGroupTemplate?.ROLES?.ROLE
      : [VmGroupTemplate?.ROLES?.ROLE]
    const knownTemplate = schema.cast(
      {
        [GENERAL_ID]: { ...VmGroupTemplate },

        [ROLE_DEFINITION_ID]: definedRoles.map((role) => ({
          ...role,
          HOST_AFFINED: role?.HOST_AFFINED?.split(',').map((r) => r.trim()),
          HOST_ANTI_AFFINED: role?.HOST_ANTI_AFFINED?.split(',').map((r) =>
            r.trim()
          ),
        })),
        [ROLE_TO_ROLE_ID]: {
          AFFINED_GROUPS: affinedGroups?.map((role) => role?.split(',')),

          ANTI_AFFINED_GROUPS: antiAffinedGroups?.map((role) =>
            role?.split(',')
          ),
        },
      },
      {
        stripUnknown: true,
      }
    )

    return knownTemplate
  },

  transformBeforeSubmit: (formData) => {
    const {
      [GENERAL_ID]: generalData,
      [ROLE_DEFINITION_ID]: roleDefinitionData,
      [ROLE_TO_ROLE_ID]: roleToRoleData,
    } = formData

    return {
      NAME: generalData.NAME,
      DESCRIPTION: generalData.DESCRIPTION,
      ROLE: roleDefinitionData.map(
        ({ HOST_AFFINED, HOST_ANTI_AFFINED, ...role }) => ({
          ...role,
          ...(HOST_AFFINED &&
            HOST_AFFINED?.length > 0 && {
              HOST_AFFINED: HOST_AFFINED.join(', ') ?? [],
            }),
          ...(HOST_ANTI_AFFINED &&
            HOST_ANTI_AFFINED?.length > 0 && {
              HOST_ANTI_AFFINED: HOST_ANTI_AFFINED.join(', ') ?? [],
            }),
        })
      ),
      TEMPLATE: {
        AFFINED:
          roleToRoleData?.AFFINED_GROUPS?.filter(
            (group, index, self) =>
              group !== null &&
              group !== undefined &&
              index ===
                self.findIndex(
                  (otherGroup) =>
                    otherGroup.length === group.length &&
                    otherGroup.every((item) => group.includes(item))
                )
          )?.map((group) =>
            group.filter((item) => typeof item === 'string').join(',')
          ) ?? [],
        ANTI_AFFINED:
          roleToRoleData?.ANTI_AFFINED_GROUPS?.filter(
            (group, index, self) =>
              group !== null &&
              group !== undefined &&
              index ===
                self.findIndex(
                  (otherGroup) =>
                    otherGroup.length === group.length &&
                    otherGroup.every((item) => group.includes(item))
                )
          )?.map((group) =>
            group.filter((item) => typeof item === 'string').join(',')
          ) ?? [],
      },
    }
  },
})

export default Steps
