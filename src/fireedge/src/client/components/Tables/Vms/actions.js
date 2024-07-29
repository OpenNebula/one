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
import { Typography } from '@mui/material'
import { makeStyles } from '@mui/styles'
import {
  AddCircledOutline,
  Cart,
  Group,
  Lock,
  PlayOutline,
  SaveFloppyDisk,
  SystemShut,
  TransitionRight,
  Trash,
} from 'iconoir-react'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import { useViews } from 'client/features/Auth'
import { useGeneralApi } from 'client/features/General'
import { useGetDatastoresQuery } from 'client/features/OneApi/datastore'
import {
  useActionVmMutation,
  useBackupMutation,
  useRestoreMutation,
  useChangeVmOwnershipMutation,
  useDeployMutation,
  useLockVmMutation,
  useMigrateMutation,
  useRecoverMutation,
  useSaveAsTemplateMutation,
  useUnlockVmMutation,
} from 'client/features/OneApi/vm'

import {
  BackupForm,
  ChangeGroupForm,
  ChangeUserForm,
  MigrateForm,
  RecoverForm,
  SaveAsTemplateForm,
} from 'client/components/Forms/Vm'
import { RestoreForm } from 'client/components/Forms/Backup'
import {
  GlobalAction,
  createActions,
} from 'client/components/Tables/Enhanced/Utils'
import VmTemplatesTable from 'client/components/Tables/Vms/VmTemplateTable'

import { PATH } from 'client/apps/sunstone/routesOne'
import { Translate } from 'client/components/HOC'
import { RESOURCE_NAMES, T, VM_ACTIONS } from 'client/constants'
import { getLastHistory, isAvailableAction } from 'client/models/VirtualMachine'

const useTableStyles = makeStyles({
  body: { gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' },
})

const isDisabled = (action) => (rows) =>
  !isAvailableAction(
    action,
    rows.map(({ original }) => original)
  )

const ListVmNames = ({ rows = [] }) => {
  const { data: datastores = [] } = useGetDatastoresQuery()

  return rows?.map?.(({ id, original }) => {
    const { ID, NAME } = original
    const { HID = '', HOSTNAME = '--', DS_ID = '' } = getLastHistory(original)
    const DS_NAME = datastores?.find((ds) => ds?.ID === DS_ID)?.NAME ?? '--'

    return (
      <Typography
        key={`vm-${id}`}
        variant="inherit"
        component="span"
        display="block"
      >
        <Translate
          word={T.WhereIsRunning}
          values={[
            `${ID} ${NAME}`,
            `${HID} ${HOSTNAME}`,
            `${DS_ID} ${DS_NAME}`,
          ]}
        />
      </Typography>
    )
  })
}

const SubHeader = (rows) => <ListVmNames rows={rows} />

const MessageToConfirmAction = (rows) => (
  <>
    <ListVmNames rows={rows} />
    <Translate word={T.DoYouWantProceed} />
  </>
)

/**
 * Generates the actions to operate resources on VM table.
 *
 * @returns {GlobalAction} - Actions
 */
const Actions = () => {
  const history = useHistory()
  const { view, getResourceView } = useViews()
  const { enqueueSuccess } = useGeneralApi()

  const [saveAsTemplate] = useSaveAsTemplateMutation()
  const [actionVm] = useActionVmMutation()
  const [recover] = useRecoverMutation()
  const [backup] = useBackupMutation()
  const [restore] = useRestoreMutation()
  const [changeOwnership] = useChangeVmOwnershipMutation()
  const [deploy] = useDeployMutation()
  const [migrate] = useMigrateMutation()
  const [lock] = useLockVmMutation()
  const [unlock] = useUnlockVmMutation()

  const vmActions = useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.VM)?.actions,
        actions: [
          {
            accessor: VM_ACTIONS.CREATE_DIALOG,
            dataCy: `vm_${VM_ACTIONS.CREATE_DIALOG}`,
            tooltip: T.Create,
            icon: AddCircledOutline,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Instantiate,
                  children: () => {
                    const classes = useTableStyles()

                    const redirectToInstantiate = (template) =>
                      history.push(PATH.TEMPLATE.VMS.INSTANTIATE, template)

                    return (
                      <VmTemplatesTable
                        disableGlobalSort
                        disableRowSelect
                        classes={classes}
                        onRowClick={redirectToInstantiate}
                      />
                    )
                  },
                  fixedWidth: true,
                  fixedHeight: true,
                  handleAccept: undefined,
                  dataCy: `modal-${VM_ACTIONS.CREATE_DIALOG}`,
                },
              },
            ],
          },
          {
            accessor: VM_ACTIONS.RESUME,
            dataCy: `vm_${VM_ACTIONS.RESUME}`,
            disabled: isDisabled(VM_ACTIONS.RESUME),
            tooltip: T.Resume,
            selected: true,
            icon: PlayOutline,
            action: async (rows) => {
              const ids = rows?.map?.(({ original }) => original?.ID)
              await Promise.all(
                ids.map((id) => actionVm({ id, action: 'resume' }))
              )
            },
          },
          {
            accessor: VM_ACTIONS.CREATE_APP_DIALOG,
            dataCy: `vm_${VM_ACTIONS.CREATE_APP_DIALOG}`,
            disabled: isDisabled(VM_ACTIONS.CREATE_APP_DIALOG),
            tooltip: T.CreateMarketApp,
            selected: { max: 1 },
            icon: Cart,
            action: (rows) => {
              const vm = rows?.[0]?.original ?? {}
              const path = PATH.STORAGE.MARKETPLACE_APPS.CREATE

              history.push(path, [RESOURCE_NAMES.VM, vm])
            },
          },
          {
            accessor: VM_ACTIONS.SAVE_AS_TEMPLATE,
            dataCy: `vm_${VM_ACTIONS.SAVE_AS_TEMPLATE}`,
            disabled: isDisabled(VM_ACTIONS.SAVE_AS_TEMPLATE),
            tooltip: T.SaveAsTemplate,
            selected: { max: 1 },
            icon: SaveFloppyDisk,
            options: [
              {
                dialogProps: {
                  title: T.SaveAsTemplate,
                  subheader: SubHeader,
                },
                form: SaveAsTemplateForm,
                onSubmit: (rows) => async (formData) => {
                  const data = { id: rows?.[0]?.original?.ID, ...formData }
                  const response = await saveAsTemplate(data)
                  enqueueSuccess(response)
                },
              },
            ],
          },
          {
            tooltip: T.Manage,
            icon: SystemShut,
            selected: true,
            color: 'secondary',
            dataCy: 'vm-manage',
            options: [
              {
                accessor: VM_ACTIONS.SUSPEND,
                disabled: isDisabled(VM_ACTIONS.SUSPEND),
                name: T.Suspend,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Suspend,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${VM_ACTIONS.SUSPEND}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => actionVm({ id, action: 'suspend' }))
                  )
                },
              },
              {
                accessor: VM_ACTIONS.STOP,
                disabled: isDisabled(VM_ACTIONS.STOP),
                name: T.Stop,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Stop,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${VM_ACTIONS.STOP}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => actionVm({ id, action: 'stop' }))
                  )
                },
              },
              {
                accessor: VM_ACTIONS.POWEROFF,
                disabled: isDisabled(VM_ACTIONS.POWEROFF),
                name: T.Poweroff,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Poweroff,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${VM_ACTIONS.POWEROFF}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => actionVm({ id, action: 'poweroff' }))
                  )
                },
              },
              {
                accessor: VM_ACTIONS.POWEROFF_HARD,
                disabled: isDisabled(VM_ACTIONS.POWEROFF_HARD),
                name: T.PoweroffHard,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.PoweroffHard,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${VM_ACTIONS.POWEROFF_HARD}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => actionVm({ id, action: 'poweroff-hard' }))
                  )
                },
              },
              {
                accessor: VM_ACTIONS.REBOOT,
                disabled: isDisabled(VM_ACTIONS.REBOOT),
                name: T.Reboot,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Reboot,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${VM_ACTIONS.REBOOT}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => actionVm({ id, action: 'reboot' }))
                  )
                },
              },
              {
                accessor: VM_ACTIONS.REBOOT_HARD,
                disabled: isDisabled(VM_ACTIONS.REBOOT_HARD),
                name: T.RebootHard,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.RebootHard,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${VM_ACTIONS.REBOOT_HARD}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => actionVm({ id, action: 'reboot-hard' }))
                  )
                },
              },
              {
                accessor: VM_ACTIONS.UNDEPLOY,
                disabled: isDisabled(VM_ACTIONS.UNDEPLOY),
                name: T.Undeploy,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Undeploy,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${VM_ACTIONS.UNDEPLOY}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => actionVm({ id, action: 'undeploy' }))
                  )
                },
              },
              {
                accessor: VM_ACTIONS.UNDEPLOY_HARD,
                disabled: isDisabled(VM_ACTIONS.UNDEPLOY_HARD),
                name: T.UndeployHard,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.UndeployHard,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${VM_ACTIONS.UNDEPLOY_HARD}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => actionVm({ id, action: 'undeploy-hard' }))
                  )
                },
              },
            ],
          },
          {
            tooltip: T.Host,
            icon: TransitionRight,
            selected: true,
            color: 'secondary',
            dataCy: 'vm-host',
            options: [
              {
                accessor: VM_ACTIONS.DEPLOY,
                disabled: isDisabled(VM_ACTIONS.DEPLOY),
                name: T.Deploy,
                form: MigrateForm,
                dialogProps: {
                  title: T.Deploy,
                  dataCy: `modal-${VM_ACTIONS.DEPLOY}`,
                },
                onSubmit: (rows) => async (formData) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => deploy({ id, ...formData }))
                  )
                },
              },
              {
                accessor: VM_ACTIONS.MIGRATE,
                disabled: isDisabled(VM_ACTIONS.MIGRATE),
                name: T.Migrate,
                form: MigrateForm,
                dialogProps: {
                  title: T.Migrate,
                  subheader: SubHeader,
                  dataCy: `modal-${VM_ACTIONS.MIGRATE}`,
                },
                onSubmit: (rows) => async (formData) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => migrate({ id, ...formData }))
                  )
                },
              },
              {
                accessor: VM_ACTIONS.MIGRATE_LIVE,
                disabled: isDisabled(VM_ACTIONS.MIGRATE_LIVE),
                name: T.MigrateLive,
                form: MigrateForm,
                dialogProps: {
                  title: T.Migrate,
                  subheader: SubHeader,
                  dataCy: `modal-${VM_ACTIONS.MIGRATE_LIVE}`,
                },
                onSubmit: (rows) => async (formData) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => migrate({ id, ...formData, live: true }))
                  )
                },
              },
              {
                accessor: VM_ACTIONS.HOLD,
                disabled: isDisabled(VM_ACTIONS.HOLD),
                name: T.Hold,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Hold,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${VM_ACTIONS.HOLD}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => actionVm({ id, action: 'hold' }))
                  )
                },
              },
              {
                accessor: VM_ACTIONS.RELEASE,
                disabled: isDisabled(VM_ACTIONS.RELEASE),
                name: T.Release,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Release,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${VM_ACTIONS.RELEASE}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => actionVm({ id, action: 'release' }))
                  )
                },
              },
              {
                accessor: VM_ACTIONS.RESCHED,
                disabled: isDisabled(VM_ACTIONS.RESCHED),
                name: T.Reschedule,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Reschedule,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${VM_ACTIONS.RESCHED}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => actionVm({ id, action: 'resched' }))
                  )
                },
              },
              {
                accessor: VM_ACTIONS.UNRESCHED,
                disabled: isDisabled(VM_ACTIONS.UNRESCHED),
                name: T.UnReschedule,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.UnReschedule,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${VM_ACTIONS.UNRESCHED}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => actionVm({ id, action: 'unresched' }))
                  )
                },
              },
              {
                accessor: VM_ACTIONS.RECOVER,
                disabled: isDisabled(VM_ACTIONS.RECOVER),
                name: T.Recover,
                dialogProps: {
                  title: T.Recover,
                  subheader: SubHeader,
                  dataCy: `modal-${VM_ACTIONS.RECOVER}`,
                },
                form: RecoverForm,
                onSubmit: (rows) => async (formData) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => recover({ id, ...formData }))
                  )
                },
              },
              {
                accessor: VM_ACTIONS.BACKUP,
                disabled: isDisabled(VM_ACTIONS.BACKUP),
                name: T.Backup,
                dialogProps: {
                  title: T.Backup,
                  subheader: SubHeader,
                  dataCy: `modal-${VM_ACTIONS.BACKUP}`,
                },
                form: (row) => {
                  const vm = row?.[0]?.original
                  const vmId = vm?.ID

                  return BackupForm({
                    stepProps: {
                      vmId,
                    },
                  })
                },
                onSubmit: (rows) => async (formData) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => backup({ id, ...formData }))
                  )
                },
              },
              {
                accessor: VM_ACTIONS.RESTORE,
                disabled: isDisabled(VM_ACTIONS.RESTORE),
                name: T.Restore,
                selected: { max: 1 },
                dialogProps: {
                  title: T.RestoreVm,
                  subheader: SubHeader,
                  dataCy: `modal-${VM_ACTIONS.RESTORE}`,
                },
                form: (row) => {
                  const vm = row?.[0]?.original
                  const vmId = vm?.ID
                  const backupIds = [].concat(vm?.BACKUPS?.BACKUP_IDS?.ID ?? [])

                  return RestoreForm({
                    stepProps: {
                      disableImageSelection: false,
                      vmsId: [vmId],
                      backupIds,
                    },
                  })
                },
                onSubmit: (rows) => async (formData) => {
                  const vmId = rows?.[0]?.id
                  const imageId = formData?.backupImgId?.ID
                  const incrementId = formData?.increment_id
                  const diskId = formData?.individualDisk
                  await restore({
                    id: vmId,
                    imageId,
                    incrementId,
                    diskId,
                  })
                },
              },
            ],
          },
          {
            tooltip: T.Ownership,
            icon: Group,
            selected: true,
            color: 'secondary',
            dataCy: 'vm-ownership',
            options: [
              {
                accessor: VM_ACTIONS.CHANGE_OWNER,
                disabled: isDisabled(VM_ACTIONS.CHANGE_OWNER),
                name: T.ChangeOwner,
                dialogProps: {
                  title: T.ChangeOwner,
                  subheader: SubHeader,
                  dataCy: `modal-${VM_ACTIONS.CHANGE_OWNER}`,
                },
                form: ChangeUserForm,
                onSubmit: (rows) => async (newOwnership) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => changeOwnership({ id, ...newOwnership }))
                  )
                },
              },
              {
                accessor: VM_ACTIONS.CHANGE_GROUP,
                disabled: isDisabled(VM_ACTIONS.CHANGE_GROUP),
                name: T.ChangeGroup,
                dialogProps: {
                  title: T.ChangeGroup,
                  subheader: SubHeader,
                  dataCy: `modal-${VM_ACTIONS.CHANGE_GROUP}`,
                },
                form: ChangeGroupForm,
                onSubmit: (rows) => async (newOwnership) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => changeOwnership({ id, ...newOwnership }))
                  )
                },
              },
            ],
          },
          {
            tooltip: T.Lock,
            icon: Lock,
            selected: true,
            color: 'secondary',
            dataCy: 'vm-lock',
            options: [
              {
                accessor: VM_ACTIONS.LOCK,
                disabled: isDisabled(VM_ACTIONS.LOCK),
                name: T.Lock,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Lock,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${VM_ACTIONS.LOCK}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => lock({ id })))
                },
              },
              {
                accessor: VM_ACTIONS.UNLOCK,
                disabled: isDisabled(VM_ACTIONS.UNLOCK),
                name: T.Unlock,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Unlock,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${VM_ACTIONS.UNLOCK}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => unlock({ id })))
                },
              },
            ],
          },
          {
            tooltip: T.Terminate,
            icon: Trash,
            color: 'error',
            selected: true,
            dataCy: 'vm-terminate',
            options: [
              {
                accessor: VM_ACTIONS.TERMINATE,
                disabled: isDisabled(VM_ACTIONS.TERMINATE),
                name: T.Terminate,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Terminate,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${VM_ACTIONS.TERMINATE}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => actionVm({ id, action: 'terminate' }))
                  )
                },
              },
              {
                accessor: VM_ACTIONS.TERMINATE_HARD,
                name: T.TerminateHard,
                isConfirmDialog: true,
                disabled: isDisabled(VM_ACTIONS.TERMINATE_HARD),
                dialogProps: {
                  title: T.TerminateHard,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${VM_ACTIONS.TERMINATE_HARD}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => actionVm({ id, action: 'terminate-hard' }))
                  )
                },
              },
            ],
          },
        ],
      }),
    [view]
  )

  return vmActions
}

export default Actions
