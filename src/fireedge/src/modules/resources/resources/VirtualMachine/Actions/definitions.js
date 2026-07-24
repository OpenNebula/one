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

import {
  RESOURCE_NAMES,
  SERVER_CONFIG,
  T,
  VM_ACTION_ENUM,
  VM_ACTIONS,
  VM_ACTIONS_IN_CHARTER,
} from '@ConstantsModule'
import * as Forms from '@modules/resources/resources/VirtualMachine/Forms'
import * as MarketplaceApp from '@modules/resources/resources/MarketplaceApp'
import { VmAPI } from '@FeaturesModule'
import { jsonToXml } from '@UtilsModule'
import { getHypervisor } from '@ModelsModule'

const diskTemplateParams = (formData = {}) =>
  formData?.template
    ? { template: formData.template }
    : { template: jsonToXml({ DISK: formData }) }

// If no `form` isConfirmDialog is assumed
export default {
  [VM_ACTION_ENUM.RENAME]: {
    useMutation: VmAPI.useRenameVmMutation,
  },
  [VM_ACTION_ENUM.LOCK]: {
    useMutation: VmAPI.useLockVmMutation,
    description: T['resource.lock.confirmation'],
    confirmLabel: T.Lock,
  },
  [VM_ACTION_ENUM.UNLOCK]: {
    useMutation: VmAPI.useUnlockVmMutation,
    description: T['resource.unlock.confirmation'],
    confirmLabel: T.Unlock,
  },
  [VM_ACTION_ENUM.UPDATE_USER_TEMPLATE]: {
    useMutation: VmAPI.useUpdateUserTemplateMutation,
  },
  [VM_ACTION_ENUM.CHANGE_MODE]: {
    useMutation: VmAPI.useChangeVmPermissionsMutation,
  },
  [VM_ACTION_ENUM.CHANGE_OWNER]: {
    useMutation: VmAPI.useChangeVmOwnershipMutation,
  },
  [VM_ACTION_ENUM.UPDATE_CONF]: {
    useMutation: VmAPI.useUpdateConfigurationMutation,
    form: (vm) =>
      Forms.UpdateConfigurationForm({
        stepProps: { hypervisor: getHypervisor(vm), vm },
        initialValues: vm,
      }),
    dialogProps: {
      dialogWidth: { xs: 'calc(100vw - 32px)', md: '900px', lg: '1040px' },
      dialogMaxWidth: 'calc(100vw - 32px)',
      dialogMaxHeight: 'calc(100vh - 64px)',
      dialogContentMaxHeight: 'calc(100vh - 220px)',
      dialogContentOverflowY: 'auto',
    },
    params: {
      replace: 0,
    },
  },
  [VM_ACTION_ENUM.SCHED_ACTION_CREATE]: {
    useMutation: VmAPI.useAddScheduledActionMutation,
    form: Forms.CreateSchedActionForm,
    success: T.CreateScheduleActionSuccess,
    params: ({ ID, schedId, template, ...formData } = {}) =>
      template
        ? { template }
        : { template: jsonToXml({ SCHED_ACTION: formData }) },
  },
  [VM_ACTION_ENUM.SCHED_ACTION_DELETE]: {
    useMutation: VmAPI.useDeleteScheduledActionMutation,
    success: T.DeleteScheduleActionSuccess,
    isDestructive: true,
    description: T['resource.delete.confirmation'],
    confirmLabel: T.Delete,
    resourceType: T.ScheduleAction,
    params: ({ ID, schedId } = {}) => ({
      schedId: schedId ?? ID,
    }),
  },
  [VM_ACTION_ENUM.SCHED_ACTION_UPDATE]: {
    useMutation: VmAPI.useUpdateScheduledActionMutation,
    form: (scheduleAction) =>
      Forms.CreateSchedActionForm({ initialValues: scheduleAction }),
    success: T.UpdateScheduleActionSuccess,
    params: ({ ID, schedId, template, ...formData } = {}) => ({
      schedId: ID,
      ...(template
        ? { template }
        : { template: jsonToXml({ SCHED_ACTION: formData }) }),
    }),
  },
  [VM_ACTION_ENUM.CHARTER_CREATE]: {
    useMutation: VmAPI.useAddScheduledActionMutation,
    success: T.CreateCharterSuccess,
    form: () => {
      const leases = Object.entries(SERVER_CONFIG?.leases ?? {}).filter(
        ([action]) => VM_ACTIONS_IN_CHARTER.includes(action)
      )

      return Forms.CreateCharterForm({
        initialValues: leases,
        stepProps: leases,
      })
    },
  },
  [VM_ACTION_ENUM.SNAPSHOT_REVERT]: {
    useMutation: VmAPI.useRevertVmSnapshotMutation,
    success: T.RevertSnapshotSuccess,
    description: T['resource.revert.confirmation'],
    confirmLabel: T.Revert,
    resourceType: T.Snapshot,
    params: ({ SNAPSHOT_ID, ID } = {}) => ({
      snapshot: SNAPSHOT_ID ?? ID,
    }),
  },
  [VM_ACTION_ENUM.SNAPSHOT_DELETE]: {
    useMutation: VmAPI.useDeleteVmSnapshotMutation,
    success: T.DeleteSnapshotSuccess,
    isDestructive: true,
    description: T['resource.delete.confirmation'],
    confirmLabel: T.Delete,
    resourceType: T.Snapshot,
    params: ({ SNAPSHOT_ID, ID } = {}) => ({
      snapshot: SNAPSHOT_ID ?? ID,
    }),
  },
  [VM_ACTION_ENUM.SNAPSHOT_CREATE]: {
    useMutation: VmAPI.useCreateVmSnapshotMutation,
    form: Forms.CreateSnapshotForm,
    success: T.CreateSnapshotSuccess,
    dialogProps: {
      dialogWidth: { xs: 'calc(100vw - 32px)', sm: '520px' },
      dialogMaxWidth: 'calc(100vw - 32px)',
      dialogPaperOverflow: 'visible',
      dialogContentOverflowY: 'visible',
    },
  },
  [VM_ACTION_ENUM.ATTACH_PCI]: {
    useMutation: VmAPI.useAttachPciMutation,
    form: Forms.AttachPciForm,
  },
  [VM_ACTION_ENUM.DETACH_PCI]: {
    useMutation: VmAPI.useDetachPciMutation,
    description: T['resource.detach.confirmation'],
    confirmLabel: T.Detach,
    isDestructive: true,
    resourceType: T.Pci,
    params: ({ PCI_ID } = {}) => ({
      pci: PCI_ID,
    }),
  },
  [VM_ACTION_ENUM.ATTACH_SEC_GROUP]: {
    useMutation: VmAPI.useAttachSecurityGroupMutation,
    form: Forms.AttachSecGroupForm,
    success: T.AttachSecurityGroupSuccess,
  },
  [VM_ACTION_ENUM.UPDATE_NIC]: {
    useMutation: VmAPI.useUpdateNicMutation,
    form: Forms.UpdateNicForm,
    success: T.UpdatedNicSuccess,
  },
  [VM_ACTION_ENUM.ATTACH_NIC]: {
    useMutation: VmAPI.useAttachNicMutation,
    form: Forms.AttachNicForm,
    success: T.AttachNicSuccess,
  },
  [VM_ACTION_ENUM.ATTACH_NIC_ALIAS]: {
    form: Forms.AliasForm,
  },
  [VM_ACTION_ENUM.DETACH_NIC]: {
    useMutation: VmAPI.useDetachNicMutation,
    success: T.DetachNicSuccess,
    description: T['resource.detach.confirmation'],
    confirmLabel: T.Detach,
    isDestructive: true,
    resourceType: T.NIC,
    params: ({ NIC_ID } = {}) => ({
      nic: NIC_ID,
    }),
  },
  [VM_ACTION_ENUM.ATTACH_DISK_IMAGE]: {
    useMutation: VmAPI.useAttachDiskMutation,
    form: Forms.ImageSteps,
    success: T.AttachDiskSuccess,
    params: diskTemplateParams,
  },
  [VM_ACTION_ENUM.ATTACH_DISK_VOLATILE]: {
    useMutation: VmAPI.useAttachDiskMutation,
    form: Forms.VolatileSteps,
    success: T.AttachDiskSuccess,
    params: diskTemplateParams,
  },
  [VM_ACTION_ENUM.DETACH_DISK]: {
    useMutation: VmAPI.useDetachDiskMutation,
    success: T.DetachDiskSuccess,
    description: T['resource.detach.confirmation'],
    confirmLabel: T.Detach,
    isDestructive: true,
    resourceType: T.Disk,
    params: ({ DISK_ID } = {}) => ({
      disk: DISK_ID,
    }),
  },
  [VM_ACTION_ENUM.DISK_SAVEAS]: {
    useMutation: VmAPI.useSaveAsDiskMutation,
    form: () => Forms.SaveAsDiskForm(),
    success: T.SaveAsDiskSuccess,
    dialogProps: {
      dialogWidth: { xs: 'calc(100vw - 32px)', sm: '520px' },
      dialogMaxWidth: 'calc(100vw - 32px)',
    },
    params: ({ DISK_ID, NAME, SNAPSHOT_ID } = {}) => ({
      disk: DISK_ID,
      name: NAME,
      snapshot: SNAPSHOT_ID ?? -1,
    }),
  },
  [VM_ACTION_ENUM.RESIZE_DISK]: {
    useMutation: VmAPI.useResizeDiskMutation,
    form: (disk) => Forms.ResizeDiskForm({ initialValues: disk }),
    success: T.ResizeDiskSuccess,
    params: ({ DISK_ID, SIZE } = {}) => ({
      disk: DISK_ID,
      size: SIZE,
    }),
  },
  [VM_ACTION_ENUM.SNAPSHOT_DISK_CREATE]: {
    useMutation: VmAPI.useCreateDiskSnapshotMutation,
    form: () => Forms.CreateDiskSnapshotForm(),
    success: T.CreateDiskSnapshotSuccess,
    dialogProps: {
      dialogWidth: { xs: 'calc(100vw - 32px)', sm: '520px' },
      dialogMaxWidth: 'calc(100vw - 32px)',
      dialogPaperOverflow: 'visible',
      dialogContentOverflowY: 'visible',
    },
    params: ({ DISK_ID, NAME } = {}) => ({
      disk: DISK_ID,
      name: NAME,
    }),
  },
  [VM_ACTION_ENUM.SNAPSHOT_DISK_RENAME]: {
    useMutation: VmAPI.useRenameDiskSnapshotMutation,
    form: (snapshot) =>
      Forms.CreateDiskSnapshotForm({ initialValues: snapshot }),
    success: T.RenameDiskSnapshotSuccess,
    params: (formData = {}) => ({
      disk: formData?.DISK_ID,
      snapshot: formData?.SNAPSHOT_ID ?? formData?.ID,
      name: formData?.NAME,
    }),
  },
  [VM_ACTION_ENUM.SNAPSHOT_DISK_REVERT]: {
    useMutation: VmAPI.useRevertDiskSnapshotMutation,
    success: T.RevertDiskSnapshotSuccess,
    description: T['resource.revert.confirmation'],
    confirmLabel: T.Revert,
    resourceType: T.DiskSnapshot,
    params: (formData = {}) => ({
      disk: formData?.DISK_ID,
      snapshot: formData?.SNAPSHOT_ID ?? formData?.ID,
    }),
  },
  [VM_ACTION_ENUM.SNAPSHOT_DISK_DELETE]: {
    useMutation: VmAPI.useDeleteDiskSnapshotMutation,
    success: T.DeleteDiskSnapshotSuccess,
    isDestructive: true,
    description: T['resource.delete.confirmation'],
    confirmLabel: T.Delete,
    resourceType: T.DiskSnapshot,
    params: (formData = {}) => ({
      disk: formData?.DISK_ID,
      snapshot: formData?.SNAPSHOT_ID ?? formData?.ID,
    }),
  },
  [VM_ACTION_ENUM.MIGRATE]: {
    useMutation: VmAPI.useMigrateMutation,
    form: Forms.MigrateForm,
    isFormDialog: true,
  },
  [VM_ACTION_ENUM.MIGRATE_LIVE]: {
    useMutation: VmAPI.useMigrateMutation,
    form: Forms.MigrateForm,
    isFormDialog: true,
    params: { live: true },
  },
  [VM_ACTION_ENUM.RELEASE]: {
    useMutation: VmAPI.useActionVmMutation,
    params: { action: VM_ACTIONS.RELEASE },
  },
  [VM_ACTION_ENUM.RESCHED]: {
    useMutation: VmAPI.useActionVmMutation,
    params: { action: VM_ACTIONS.RESCHED },
  },
  [VM_ACTION_ENUM.UNRESCHED]: {
    useMutation: VmAPI.useActionVmMutation,
    params: { action: VM_ACTIONS.UNRESCHED },
  },
  [VM_ACTION_ENUM.RECOVER]: {
    useMutation: VmAPI.useRecoverMutation,
    form: Forms.RecoverForm,
  },
  [VM_ACTION_ENUM.CREATE_APP_DIALOG]: {
    title: T.CreateApp,
    tooltip: T.CreateApp,
    form: (vm) =>
      MarketplaceApp.Forms.CreateForm({
        initialValues: {
          type: RESOURCE_NAMES.VM,
          id: vm?.ID,
        },
      }),
    dialogProps: {
      title: T.CreateApp,
      dialogWidth: { xs: 'calc(100vw - 32px)', md: '900px', lg: '1040px' },
      dialogMaxWidth: 'calc(100vw - 32px)',
      dialogMaxHeight: 'calc(100vh - 64px)',
      dialogContentOverflowY: 'auto',
      PaperProps: {
        sx: {
          overflow: 'hidden',
          '& > .MuiDialogActions-root': {
            display: 'none',
          },
        },
      },
    },
    success: T.SuccessMarketplaceAppCreated,
  },
  [VM_ACTION_ENUM.SAVE_AS_TEMPLATE]: {
    useMutation: VmAPI.useSaveAsTemplateMutation,
    form: () => Forms.SaveAsTemplateForm(),
    dialogProps: {
      title: T.SaveAsTemplate,
      dialogWidth: { xs: 'calc(100vw - 32px)', sm: '520px' },
      dialogMaxWidth: 'calc(100vw - 32px)',
    },
  },
  [VM_ACTION_ENUM.BACKUP_CONFIGURE]: {
    useMutation: VmAPI.useUpdateConfigurationMutation,
    params: { replace: 0 },
    form: (vm) =>
      Forms.BackupConfigForm({
        stepProps: { vm },
        initialValues: vm,
      }),
    dialogProps: {
      dialogWidth: { xs: 'calc(100vw - 32px)', md: '900px', lg: '1040px' },
      dialogMaxWidth: 'calc(100vw - 32px)',
      dialogMaxHeight: 'calc(100vh - 64px)',
      dialogContentMaxHeight: 'calc(100vh - 220px)',
      dialogContentOverflowY: 'auto',
    },
  },
  [VM_ACTION_ENUM.BACKUP_CREATE]: {
    title: 'Create Backup',
    tooltip: 'Create Backup',
    useMutation: VmAPI.useBackupMutation,
    form: (vm) =>
      Forms.BackupForm({
        stepProps: {
          vmId: vm?.ID,
          vm,
        },
      }),
    dialogProps: {
      title: 'Create Backup',
      dialogWidth: { xs: 'calc(100vw - 32px)', md: '900px', lg: '1040px' },
      dialogMaxWidth: 'calc(100vw - 32px)',
      dialogMaxHeight: 'calc(100vh - 64px)',
      dialogContentOverflowY: 'auto',
      hideActions: true,
      PaperProps: {
        sx: {
          overflow: 'hidden',
        },
      },
    },
  },
  [VM_ACTION_ENUM.BACKUP_RESTORE]: {
    title: 'Restore Backup',
    tooltip: 'Restore Backup',
    useMutation: VmAPI.useRestoreMutation,
    form: (vm) =>
      Forms.BackupRestoreForm({
        stepProps: {
          disableImageSelection: false,
          vmsId: vm?.ID === undefined ? [] : [vm.ID],
          backupIds: [].concat(vm?.BACKUPS?.BACKUP_IDS?.ID ?? []),
        },
      }),
    dialogProps: {
      title: 'Restore Backup',
      dialogWidth: { xs: 'calc(100vw - 32px)', md: '900px', lg: '1040px' },
      dialogMaxWidth: 'calc(100vw - 32px)',
      dialogMaxHeight: 'calc(100vh - 64px)',
      dialogContentOverflowY: 'auto',
      PaperProps: {
        sx: {
          overflow: 'hidden',
          '& > .MuiDialogActions-root': {
            display: 'none',
          },
        },
      },
    },
    params: (formData = {}) => ({
      imageId: formData?.backupImgId?.ID,
      incrementId: formData?.increment_id,
      diskId: formData?.individualDisk,
    }),
  },
  [VM_ACTION_ENUM.RESUME]: {
    useMutation: VmAPI.useActionVmMutation,
    params: { action: VM_ACTIONS.RESUME },
  },
  [VM_ACTION_ENUM.SUSPEND]: {
    useMutation: VmAPI.useActionVmMutation,
    params: { action: VM_ACTIONS.SUSPEND },
  },
  [VM_ACTION_ENUM.STOP]: {
    useMutation: VmAPI.useActionVmMutation,
    params: { action: VM_ACTIONS.STOP },
  },
  [VM_ACTION_ENUM.POWEROFF]: {
    useMutation: VmAPI.useActionVmMutation,
    params: { action: VM_ACTIONS.POWEROFF },
  },
  [VM_ACTION_ENUM.POWEROFF_HARD]: {
    useMutation: VmAPI.useActionVmMutation,
    params: { action: VM_ACTIONS.POWEROFF_HARD },
  },
  [VM_ACTION_ENUM.REBOOT]: {
    useMutation: VmAPI.useActionVmMutation,
    params: { action: VM_ACTIONS.REBOOT },
  },
  [VM_ACTION_ENUM.REBOOT_HARD]: {
    useMutation: VmAPI.useActionVmMutation,
    params: { action: VM_ACTIONS.REBOOT_HARD },
  },
  [VM_ACTION_ENUM.UNDEPLOY]: {
    useMutation: VmAPI.useActionVmMutation,
    params: { action: VM_ACTIONS.UNDEPLOY },
  },
  [VM_ACTION_ENUM.UNDEPLOY_HARD]: {
    useMutation: VmAPI.useActionVmMutation,
    params: { action: VM_ACTIONS.UNDEPLOY_HARD },
  },
  [VM_ACTION_ENUM.DEPLOY]: {
    useMutation: VmAPI.useDeployMutation,
    form: Forms.MigrateForm,
    isFormDialog: true,
  },
  [VM_ACTION_ENUM.HOLD]: {
    useMutation: VmAPI.useActionVmMutation,
    params: { action: VM_ACTIONS.HOLD },
  },
  [VM_ACTION_ENUM.TERMINATE]: {
    useMutation: VmAPI.useActionVmMutation,
    isDestructive: true,
    params: { action: VM_ACTIONS.TERMINATE },
  },
  [VM_ACTION_ENUM.TERMINATE_HARD]: {
    useMutation: VmAPI.useActionVmMutation,
    isDestructive: true,
    params: { action: VM_ACTIONS.TERMINATE_HARD },
  },
}
