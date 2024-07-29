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
import { Component, useCallback, useEffect } from 'react'
import { useHistory, useLocation } from 'react-router'
import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from 'client/components/FormStepper'
import { CreateForm } from 'client/components/Forms/VmGroup'
import {
  useAddVMGroupRoleMutation,
  useAllocateVMGroupMutation,
  useDeleteVMGroupRoleMutation,
  useGetVMGroupQuery,
  useUpdateVMGroupMutation,
  useUpdateVMGroupRoleMutation,
} from 'client/features/OneApi/vmGroup'
import { jsonToXml } from 'client/models/Helper'
import { PATH } from 'client/apps/sunstone/routesOne'
import { useGeneralApi } from 'client/features/General'
import { isEqual } from 'lodash'
import { isDevelopment } from 'client/utils'
import { T } from 'client/constants'

/**
 * Compares two role objects while ignoring the ID property of the original role.
 *
 * @param {object} originalRole - The original role object.
 * @param {object} updatedRole - The updated role object.
 * @returns {boolean} - True if the roles are equal (ignoring the ID), false otherwise.
 */
const compareRoles = (originalRole, updatedRole) => {
  const originalCopy = { ...originalRole }
  delete originalCopy.ID

  return isEqual(originalCopy, updatedRole)
}

/**
 * Processes the role differences and returns categorized roles.
 *
 * @param {Array} originalRoles - The original roles.
 * @param {Array} newRoles - The updated roles.
 * @returns {object} - An object containing arrays of added, updated, and removed roles.
 */
const categorizeRoles = (originalRoles, newRoles) => {
  const wrappedOriginalRoles = Array.isArray(originalRoles)
    ? originalRoles
    : [originalRoles]

  const wrappedNewRoles = Array.isArray(newRoles) ? newRoles : [newRoles]

  const originalMap = new Map(
    wrappedOriginalRoles?.map((role) => [role.NAME, role])
  )
  const updatedMap = new Map(wrappedNewRoles?.map((role) => [role.NAME, role]))

  const addedRoles = []
  const updatedRoles = []
  const removedRoles = []

  for (const [name, updatedRole] of updatedMap) {
    const originalRole = originalMap?.get(name)
    if (!originalRole) {
      addedRoles?.push(updatedRole)
    } else if (!compareRoles(originalRole, updatedRole)) {
      updatedRoles?.push({ original: originalRole, updated: updatedRole })
    }
    originalMap?.delete(name)
  }

  for (const removedRole of originalMap?.values()) {
    removedRoles?.push(removedRole)
  }

  return { addedRoles, updatedRoles, removedRoles }
}

/**
 * Displays the creation form for a VmGroup.
 *
 * @returns {Component} VmGroup form.
 */
function CreateVmGroup() {
  const history = useHistory()
  const { state: { ID: templateId, NAME } = {} } = useLocation()
  const { enqueueSuccess, enqueueError } = useGeneralApi()
  const [createVmGroup] = useAllocateVMGroupMutation()
  const [updateVmGroup] = useUpdateVMGroupMutation()
  const [addNewRole] = useAddVMGroupRoleMutation()
  const [updateRoleProperty] = useUpdateVMGroupRoleMutation()
  const [removeRoleProperty] = useDeleteVMGroupRoleMutation()
  const updatedRoleProperties = [
    'POLICY',
    'NAME',
    'HOST_AFFINED',
    'HOST_ANTI_AFFINED',
  ]

  const { data, error } = useGetVMGroupQuery(
    { id: templateId, extended: true },
    { skip: templateId === undefined }
  )

  useEffect(() => {
    if (error) {
      enqueueError(T.ErrorVMGroupFetch, error.message)
    }
  }, [error])

  const findDifferencesAndUpdate = useCallback(
    async (vmGroupID, original, updated, props) => {
      const { addedRoles, updatedRoles, removedRoles } = categorizeRoles(
        original,
        updated
      )

      const addRolesPromises = addedRoles.map((addedRole) =>
        addNewRole({
          id: vmGroupID,
          template: jsonToXml({ ROLE: addedRole }),
        })
      )

      const updateRolesPromises = updatedRoles.map(
        ({ original: originalRole, updated: updatedRole }) =>
          updatedRoleProperties.reduce(async (_acc, key) => {
            if (updatedRole[key] !== originalRole[key]) {
              await updateRoleProperty({
                id: vmGroupID,
                roleId: originalRole.ID,
                template: jsonToXml({ ROLE: updatedRole }),
              })
            }
          }, Promise.resolve())
      )

      await Promise.all([...addRolesPromises, ...updateRolesPromises])

      // eslint-disable-next-line react/prop-types
      const { TEMPLATE, ...rest } = props
      await updateVmGroup({
        id: templateId,
        template: jsonToXml({ ...rest, ...TEMPLATE }),
      }).unwrap()

      const removeRolesPromises = removedRoles.map((removedRole) =>
        removeRoleProperty({ id: vmGroupID, roleId: removedRole.ID })
      )

      await Promise.all(removeRolesPromises)
    },
    [addNewRole, updateRoleProperty, removeRoleProperty, updateVmGroup]
  )

  const onSubmit = useCallback(
    async (props) => {
      try {
        // eslint-disable-next-line react/prop-types
        const { TEMPLATE, ...rest } = props
        if (!templateId) {
          const newVmGroupId = await createVmGroup({
            template: jsonToXml({ ...rest, ...TEMPLATE }),
          }).unwrap()
          history.push(PATH.TEMPLATE.VMGROUP.LIST)
          enqueueSuccess(T.SuccessVMGroupCreated, newVmGroupId)
        } else {
          const originalRoles = data?.ROLES?.ROLE
          // eslint-disable-next-line react/prop-types
          const newRoles = props?.ROLE
          await findDifferencesAndUpdate(
            templateId,
            originalRoles,
            newRoles,
            props
          )

          history.push(PATH.TEMPLATE.VMGROUP.LIST)
          enqueueSuccess(T.SuccessVMGroupUpdated, [templateId, NAME])
        }
      } catch (error) {
        isDevelopment() && console.error(`Error in VM group form: ${error}`)
      }
    },
    [
      templateId,
      createVmGroup,
      history,
      enqueueSuccess,
      findDifferencesAndUpdate,
      enqueueError,
      NAME,
    ]
  )

  return templateId && !data ? (
    <SkeletonStepsForm />
  ) : (
    <CreateForm
      onSubmit={onSubmit}
      initialValues={data}
      stepProps={data}
      fallback={<SkeletonStepsForm />}
    >
      {(config) => <DefaultFormStepper {...config} />}
    </CreateForm>
  )
}

export default CreateVmGroup
