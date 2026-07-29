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
/* eslint-disable jsdoc/require-jsdoc */

import { useMemo } from 'react'
import { VmAPI } from '@FeaturesModule'
import ACTION_DEFINITIONS from '@modules/resources/resources/VirtualMachine/Actions/definitions'

const resolveMutation =
  ({ trigger, context, params = {} }) =>
  (callParams = {}) => {
    const allParams = {
      ...callParams,
      ...(typeof params === 'function' ? params(callParams) : params),
    }

    return context(trigger)({
      ...allParams,
    })
  }

const resolveDefs = (hookTriggerLookup, context) =>
  Object.fromEntries(
    Object.entries(ACTION_DEFINITIONS).map(
      ([key, { useMutation, params, ...def }]) => [
        key,
        {
          ...def,
          params,
          mutate: resolveMutation({
            trigger: hookTriggerLookup.get(useMutation),
            context,
            params,
          }),
        },
      ]
    )
  )

export const useActions = ({ context }) => {
  const [rename, { isLoading: isRenaming }] = VmAPI.useRenameVmMutation()
  const [lock, { isLoading: isLocking }] = VmAPI.useLockVmMutation()
  const [unlock, { isLoading: isUnlocking }] = VmAPI.useUnlockVmMutation()
  const [updateUserTemplate, { isLoading: isUpdatingUserTemplate }] =
    VmAPI.useUpdateUserTemplateMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    VmAPI.useChangeVmPermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    VmAPI.useChangeVmOwnershipMutation()
  const [updateConf, { isLoading: isUpdatingConfiguration }] =
    VmAPI.useUpdateConfigurationMutation()
  const [addSchedAction, { isLoading: isAddingSchedAction }] =
    VmAPI.useAddScheduledActionMutation()
  const [deleteSchedAction, { isLoading: isDeletingSchedAction }] =
    VmAPI.useDeleteScheduledActionMutation()
  const [updateSchedAction, { isLoading: isUpdatingSchedAction }] =
    VmAPI.useUpdateScheduledActionMutation()
  const [revertVmSnapshot, { isLoading: isRevertingVmSnapshot }] =
    VmAPI.useRevertVmSnapshotMutation()
  const [deleteVmSnapshot, { isLoading: isDeletingVmSnapshot }] =
    VmAPI.useDeleteVmSnapshotMutation()
  const [createVmSnapshot, { isLoading: isSnapshottingVm }] =
    VmAPI.useCreateVmSnapshotMutation()
  const [attachPci, { isLoading: isAttachingPci }] =
    VmAPI.useAttachPciMutation()
  const [detachPci, { isLoading: isDetachingPci }] =
    VmAPI.useDetachPciMutation()
  const [attachSecGroup, { isLoading: isAttachingSecGroup }] =
    VmAPI.useAttachSecurityGroupMutation()
  const [updateNic, { isLoading: isUpdatingNic }] = VmAPI.useUpdateNicMutation()
  const [detachNic, { isLoading: isDetachingNic }] =
    VmAPI.useDetachNicMutation()
  const [attachNic, { isLoading: isAttachingNic }] =
    VmAPI.useAttachNicMutation()
  const [deleteDiskSnapshot, { isLoading: isDeletingDiskSnapshot }] =
    VmAPI.useDeleteDiskSnapshotMutation()
  const [revertDiskSnapshot, { isLoading: isRevertingDiskSnapshot }] =
    VmAPI.useRevertDiskSnapshotMutation()
  const [renameDiskSnapshot, { isLoading: isRenamingDiskSnapshot }] =
    VmAPI.useRenameDiskSnapshotMutation()
  const [createDiskSnapshot, { isLoading: isSnapshottingDisk }] =
    VmAPI.useCreateDiskSnapshotMutation()
  const [saveDisk, { isLoading: isSavingDisk }] = VmAPI.useSaveAsDiskMutation()
  const [saveAsTemplate, { isLoading: isSavingAsTemplate }] =
    VmAPI.useSaveAsTemplateMutation()
  const [resizeDisk, { isLoading: isResizingDisk }] =
    VmAPI.useResizeDiskMutation()
  const [detachDisk, { isLoading: isDetachingDisk }] =
    VmAPI.useDetachDiskMutation()
  const [attachDisk, { isLoading: isAttachingDisk }] =
    VmAPI.useAttachDiskMutation()
  const [migrate, { isLoading: isMigrating }] = VmAPI.useMigrateMutation()
  const [deploy, { isLoading: isDeploying }] = VmAPI.useDeployMutation()
  const [recover, { isLoading: isRecovering }] = VmAPI.useRecoverMutation()
  const [backup, { isLoading: isBackuping }] = VmAPI.useBackupMutation()
  const [restore, { isLoading: isRestoring }] = VmAPI.useRestoreMutation()
  const [performAction, { isLoading: isPerformingVmAction }] =
    VmAPI.useActionVmMutation()

  // THIS NEEDS TO CARRY ALL useMutation REFS FROM THE DEFS FILE
  const hookTriggerLookup = useMemo(
    () =>
      new Map([
        [VmAPI.useRenameVmMutation, rename],
        [VmAPI.useLockVmMutation, lock],
        [VmAPI.useUnlockVmMutation, unlock],
        [VmAPI.useUpdateUserTemplateMutation, updateUserTemplate],
        [VmAPI.useChangeVmPermissionsMutation, changePermissions],
        [VmAPI.useChangeVmOwnershipMutation, changeOwnership],
        [VmAPI.useActionVmMutation, performAction],
        [VmAPI.useAddScheduledActionMutation, addSchedAction],
        [VmAPI.useAttachDiskMutation, attachDisk],
        [VmAPI.useAttachNicMutation, attachNic],
        [VmAPI.useAttachPciMutation, attachPci],
        [VmAPI.useAttachSecurityGroupMutation, attachSecGroup],
        [VmAPI.useBackupMutation, backup],
        [VmAPI.useCreateDiskSnapshotMutation, createDiskSnapshot],
        [VmAPI.useCreateVmSnapshotMutation, createVmSnapshot],
        [VmAPI.useDeleteDiskSnapshotMutation, deleteDiskSnapshot],
        [VmAPI.useDeleteScheduledActionMutation, deleteSchedAction],
        [VmAPI.useDeleteVmSnapshotMutation, deleteVmSnapshot],
        [VmAPI.useDeployMutation, deploy],
        [VmAPI.useDetachDiskMutation, detachDisk],
        [VmAPI.useDetachNicMutation, detachNic],
        [VmAPI.useDetachPciMutation, detachPci],
        [VmAPI.useMigrateMutation, migrate],
        [VmAPI.useRecoverMutation, recover],
        [VmAPI.useRenameDiskSnapshotMutation, renameDiskSnapshot],
        [VmAPI.useResizeDiskMutation, resizeDisk],
        [VmAPI.useRestoreMutation, restore],
        [VmAPI.useRevertDiskSnapshotMutation, revertDiskSnapshot],
        [VmAPI.useRevertVmSnapshotMutation, revertVmSnapshot],
        [VmAPI.useSaveAsDiskMutation, saveDisk],
        [VmAPI.useSaveAsTemplateMutation, saveAsTemplate],
        [VmAPI.useUpdateConfigurationMutation, updateConf],
        [VmAPI.useUpdateNicMutation, updateNic],
        [VmAPI.useUpdateScheduledActionMutation, updateSchedAction],
      ]),
    [
      addSchedAction,
      attachDisk,
      attachNic,
      attachPci,
      attachSecGroup,
      backup,
      changeOwnership,
      changePermissions,
      createDiskSnapshot,
      createVmSnapshot,
      deleteDiskSnapshot,
      deleteSchedAction,
      deleteVmSnapshot,
      deploy,
      detachDisk,
      detachNic,
      detachPci,
      lock,
      migrate,
      performAction,
      recover,
      rename,
      renameDiskSnapshot,
      resizeDisk,
      restore,
      revertDiskSnapshot,
      revertVmSnapshot,
      saveAsTemplate,
      saveDisk,
      unlock,
      updateConf,
      updateNic,
      updateSchedAction,
      updateUserTemplate,
    ]
  )

  const resolvedDefs = useMemo(
    () => resolveDefs(hookTriggerLookup, context),
    [hookTriggerLookup, context]
  )

  const isLoading =
    isAddingSchedAction ||
    isAttachingDisk ||
    isAttachingNic ||
    isAttachingPci ||
    isAttachingSecGroup ||
    isBackuping ||
    isChangingOwnership ||
    isChangingPermissions ||
    isDeletingDiskSnapshot ||
    isDeletingSchedAction ||
    isDeletingVmSnapshot ||
    isDeploying ||
    isDetachingDisk ||
    isDetachingNic ||
    isDetachingPci ||
    isLocking ||
    isMigrating ||
    isPerformingVmAction ||
    isRecovering ||
    isRenaming ||
    isRenamingDiskSnapshot ||
    isResizingDisk ||
    isRestoring ||
    isRevertingDiskSnapshot ||
    isRevertingVmSnapshot ||
    isSavingAsTemplate ||
    isSavingDisk ||
    isSnapshottingDisk ||
    isSnapshottingVm ||
    isUnlocking ||
    isUpdatingConfiguration ||
    isUpdatingNic ||
    isUpdatingSchedAction ||
    isUpdatingUserTemplate

  return { actions: resolvedDefs, isLoading }
}
