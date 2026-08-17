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
import { ReactElement } from 'react'
import { useHistory, useLocation } from 'react-router'

import {
  UserAPI,
  AclAPI,
  SystemAPI,
  GroupAPI,
  useGeneralApi,
} from '@FeaturesModule'

import { DefaultFormStepper, SkeletonStepsForm, QueryState } from '@ComponentsV2Module'
import { Group } from '@ResourcesModule'

import { jsonToXml } from '@UtilsModule'

import {
  createStringACL,
  createAclObjectFromString,
  getGroupPermissionChanges,
} from '@ModelsModule'

import { ACL_RIGHTS, ACL_TYPE_ID, T, PATH } from '@ConstantsModule'

/**
 * Displays the creation form for a group.
 *
 * @returns {ReactElement} - The group form component
 */
export function CreateGroup() {
  const history = useHistory()
  const { state: { ID: groupId } = {} } = useLocation()

  const { enqueueSuccess, enqueueError } = useGeneralApi()
  const [createGroup] = GroupAPI.useAllocateGroupMutation()
  const [updateGroup] = GroupAPI.useUpdateGroupMutation()
  const [addAdminToGroup] = GroupAPI.useAddAdminToGroupMutation()
  const [createUser] = UserAPI.useAllocateUserMutation()
  const [createAcl] = AclAPI.useAllocateAclMutation()
  const [removeAcl] = AclAPI.useRemoveAclMutation()

  const { data: views } = SystemAPI.useGetSunstoneAvailableViewsQuery()

  const { data: version } = SystemAPI.useGetOneVersionQuery()

  const { data: group } = GroupAPI.useGetGroupQuery({ id: groupId })

  const {
    data: acls,
    isError: isAclsError,
    error: aclsError,
  } = AclAPI.useGetAclsQuery(undefined, { skip: !groupId })

  const updateTemplate = async (props, id) => {
    // Create group template with advanced options
    if (props?.views || props?.system) {
      // Create XML template
      const template = jsonToXml({ ...props?.views, ...props?.system })

      // Merge with existing template
      const params = {
        id: id,
        template: template,
        replace: 1,
      }

      // Update group with template
      await updateGroup(params).unwrap()
    }
  }

  const updatePermissions = async (props, id) => {
    const { allocations, removals } = getGroupPermissionChanges(
      acls,
      id,
      props?.permissions
    )

    // Allocate replacement rules first to avoid temporarily revoking access.
    await Promise.all(allocations.map((acl) => createAcl(acl).unwrap()))
    await Promise.all(
      removals.map((aclId) => removeAcl({ id: aclId }).unwrap())
    )
  }

  const onSubmit = async (props) => {
    try {
      // Request to create a group but not to update
      if (!groupId) {
        // Create group
        const newGroupId = await createGroup(props.group).unwrap()

        // Create admin user
        if (props?.groupAdmin?.adminUser) {
          // Get data to create admin user
          const user = {
            ...props.groupAdmin,
            group: [newGroupId],
          }

          // Create new admin group user
          const newUserId = await createUser(user).unwrap()

          // Crete admin object to add user to the group
          const addAdmin = {
            id: newGroupId,
            user: newUserId,
          }

          // Add user to group as admin
          await addAdminToGroup(addAdmin).unwrap()
        }

        // Create acl create permissions for the group
        if (
          props?.permissions?.create &&
          props?.permissions?.create?.length > 0
        ) {
          const createAclString = createStringACL(
            ACL_TYPE_ID.GROUP,
            newGroupId,
            props.permissions.create,
            ACL_TYPE_ID.ALL,
            undefined,
            [ACL_RIGHTS.CREATE.name],
            undefined,
            undefined
          )
          await createAcl(createAclObjectFromString(createAclString))
        }

        // Create acl view permissions
        if (props?.permissions?.view && props?.permissions?.view?.length > 0) {
          const viewAclString = createStringACL(
            ACL_TYPE_ID.GROUP,
            newGroupId,
            props.permissions.view,
            ACL_TYPE_ID.GROUP,
            newGroupId,
            [ACL_RIGHTS.USE.name],
            undefined,
            undefined
          )
          await createAcl(createAclObjectFromString(viewAclString))
        }

        // Update group template with advanced options
        await updateTemplate(props, newGroupId)

        // Only show group message
        enqueueSuccess(T.SuccessGroupCreated, newGroupId)
      } else {
        // Update case. Only update template

        await Promise.all([
          updateTemplate(props, groupId),
          updatePermissions(props, groupId),
        ])

        // Only show group message
        enqueueSuccess(T.SuccessGroupUpdated, groupId)
      }

      // Go to groups list
      history.push(PATH.SYSTEM.GROUPS.LIST)
    } catch (error) {
      enqueueError(T.ErrorGroupCreated)
    }
  }

  return (
    <>
      {views && version ? (
        !groupId ? (
          <Group.Forms.CreateForm
            onSubmit={onSubmit}
            stepProps={{
              views,
              version,
            }}
            fallback={<SkeletonStepsForm />}
          >
            {(config) => <DefaultFormStepper {...config} />}
          </Group.Forms.CreateForm>
        ) : group && acls && !isAclsError ? (
          <Group.Forms.UpdateForm
            initialValues={{ group, acls }}
            onSubmit={onSubmit}
            stepProps={{
              views,
              version,
            }}
            fallback={<SkeletonStepsForm />}
          >
            {(config) => <DefaultFormStepper {...config} update />}
          </Group.Forms.UpdateForm>
        ) : isAclsError ? (
          <QueryState error={aclsError?.data} />
        ) : (
          <SkeletonStepsForm />
        )
      ) : (
        <SkeletonStepsForm />
      )}
    </>
  )
}

CreateGroup.propTypes = {
  group: PropTypes.object,
  groupAdmin: PropTypes.shape({
    adminUser: PropTypes.bool,
  }),
  permissions: PropTypes.shape({
    create: PropTypes.array,
    view: PropTypes.array,
  }),
  views: PropTypes.object,
  system: PropTypes.object,
}
