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
import { ReactElement } from 'react'
import { useHistory, useLocation } from 'react-router'

import { useGeneralApi } from 'client/features/General'
import {
  useAllocateGroupMutation,
  useAddAdminToGroupMutation,
  useUpdateGroupMutation,
  useGetGroupQuery,
} from 'client/features/OneApi/group'
import { useAllocateUserMutation } from 'client/features/OneApi/user'
import { useAllocateAclMutation } from 'client/features/OneApi/acl'

import { jsonToXml } from 'client/models/Helper'

import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from 'client/components/FormStepper'
import { CreateForm, UpdateForm } from 'client/components/Forms/Group'
import { PATH } from 'client/apps/sunstone/routesOne'

import { createStringACL, createAclObjectFromString } from 'client/models/ACL'
import { ACL_RIGHTS, ACL_TYPE_ID, T } from 'client/constants'

import systemApi from 'client/features/OneApi/system'

/**
 * Displays the creation form for a group.
 *
 * @returns {ReactElement} - The group form component
 */
function CreateGroup() {
  const history = useHistory()
  const { state: { ID: groupId } = {} } = useLocation()

  const { enqueueSuccess, enqueueError } = useGeneralApi()
  const [createGroup] = useAllocateGroupMutation()
  const [updateGroup] = useUpdateGroupMutation()
  const [addAdminToGroup] = useAddAdminToGroupMutation()
  const [createUser] = useAllocateUserMutation()
  const [createAcl] = useAllocateAclMutation()

  const { data: views } = systemApi.useGetSunstoneAvalaibleViewsQuery()
  const { data: version } = systemApi.useGetOneVersionQuery()

  const { data: group } = useGetGroupQuery({ id: groupId })

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
      await updateGroup(params)
    }
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
        updateTemplate(props, newGroupId)

        // Only show group message
        enqueueSuccess(T.SuccessGroupCreated, newGroupId)
      } else {
        // Update case. Only update template

        // Update group template with advanced options
        updateTemplate(props, groupId)

        // Only show group message
        enqueueSuccess(T.SuccessGroupUpdated, groupId)
      }

      // Go to groups list
      history.push(PATH.SYSTEM.GROUPS.LIST)
    } catch (error) {
      enqueueError(T.ErrorGroupCreated)
    }
  }

  return views && version ? (
    !groupId ? (
      <CreateForm
        onSubmit={onSubmit}
        stepProps={{
          views,
          version,
        }}
        fallback={<SkeletonStepsForm />}
      >
        {(config) => <DefaultFormStepper {...config} />}
      </CreateForm>
    ) : group ? (
      <UpdateForm
        initialValues={group}
        onSubmit={onSubmit}
        stepProps={{
          views,
          version,
        }}
        fallback={<SkeletonStepsForm />}
      >
        {(config) => <DefaultFormStepper {...config} />}
      </UpdateForm>
    ) : (
      <SkeletonStepsForm />
    )
  ) : (
    <SkeletonStepsForm />
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

export default CreateGroup
