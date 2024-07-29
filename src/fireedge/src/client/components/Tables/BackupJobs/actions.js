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
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import { ChangeGroupForm, ChangeUserForm } from 'client/components/Forms/Vm'
import { useViews } from 'client/features/Auth'
import {
  useCancelBackupJobMutation,
  useChangeBackupJobOwnershipMutation,
  useLockBackupJobMutation,
  useRemoveBackupJobMutation,
  useStartBackupJobMutation,
  useUnlockBackupJobMutation,
} from 'client/features/OneApi/backupjobs'
import {
  AddCircledOutline,
  Group,
  Lock,
  PlayOutline,
  Trash,
} from 'iconoir-react'

import { PATH } from 'client/apps/sunstone/routesOne'
import {
  createActions,
  GlobalAction,
} from 'client/components/Tables/Enhanced/Utils'

import { Translate } from 'client/components/HOC'
import { BACKUPJOB_ACTIONS, RESOURCE_NAMES, T } from 'client/constants'
import { isAvailableAction } from 'client/models/VirtualMachine'

const isDisabled = (action) => (rows) =>
  !isAvailableAction(
    action,
    rows.map(({ original }) => original)
  )

const ListBackupJobsNames = ({ rows = [] }) =>
  rows?.map?.(({ id, original }) => {
    const { ID, NAME } = original

    return (
      <Typography
        key={`backupjob-${id}`}
        variant="inherit"
        component="span"
        display="block"
      >
        {`#${ID} ${NAME}`}
      </Typography>
    )
  })

const SubHeader = (rows) => <ListBackupJobsNames rows={rows} />

const MessageToConfirmAction = (rows, description) => (
  <>
    <ListBackupJobsNames rows={rows} />
    {description && <Translate word={description} />}
    <Translate word={T.DoYouWantProceed} />
  </>
)

MessageToConfirmAction.displayName = 'MessageToConfirmAction'

/**
 * Generates the actions to operate resources on Backup Jobs Template table.
 *
 * @returns {GlobalAction} - Actions
 */
const Actions = () => {
  const history = useHistory()
  const { view, getResourceView } = useViews()
  const [changeOwnership] = useChangeBackupJobOwnershipMutation()
  const [deleteBackupJob] = useRemoveBackupJobMutation()
  const [lock] = useLockBackupJobMutation()
  const [unlock] = useUnlockBackupJobMutation()
  const [start] = useStartBackupJobMutation()
  const [cancel] = useCancelBackupJobMutation()

  return useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.BACKUPJOBS)?.actions,
        actions: [
          {
            accessor: BACKUPJOB_ACTIONS.CREATE_DIALOG,
            dataCy: `backupjob_${BACKUPJOB_ACTIONS.CREATE_DIALOG}`,
            tooltip: T.Create,
            icon: AddCircledOutline,
            action: () => history.push(PATH.STORAGE.BACKUPJOBS.CREATE),
          },
          {
            accessor: BACKUPJOB_ACTIONS.START,
            dataCy: `backupjob_${BACKUPJOB_ACTIONS.START}`,
            tooltip: T.Start,
            selected: true,
            icon: PlayOutline,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Start,
                  dataCy: `modal-${BACKUPJOB_ACTIONS.START}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => start({ id })))
                },
              },
            ],
          },
          {
            accessor: BACKUPJOB_ACTIONS.CANCEL,
            label: T.Cancel,
            selected: true,
            color: 'secondary',
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Cancel,
                  dataCy: `modal-${BACKUPJOB_ACTIONS.CANCEL}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => cancel({ id })))
                },
              },
            ],
          },
          {
            tooltip: T.Ownership,
            icon: Group,
            selected: true,
            color: 'secondary',
            dataCy: 'backupjob-ownership',
            options: [
              {
                accessor: BACKUPJOB_ACTIONS.CHANGE_OWNER,
                disabled: isDisabled(BACKUPJOB_ACTIONS.CHANGE_OWNER),
                name: T.ChangeOwner,
                dialogProps: {
                  title: T.ChangeOwner,
                  subheader: SubHeader,
                  dataCy: `modal-${BACKUPJOB_ACTIONS.CHANGE_OWNER}`,
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
                accessor: BACKUPJOB_ACTIONS.CHANGE_GROUP,
                disabled: isDisabled(BACKUPJOB_ACTIONS.CHANGE_GROUP),
                name: T.ChangeGroup,
                dialogProps: {
                  title: T.ChangeGroup,
                  subheader: SubHeader,
                  dataCy: `modal-${BACKUPJOB_ACTIONS.CHANGE_GROUP}`,
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
            dataCy: 'backupjob-lock',
            options: [
              {
                accessor: BACKUPJOB_ACTIONS.LOCK,
                name: T.Lock,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Lock,
                  dataCy: `modal-${BACKUPJOB_ACTIONS.LOCK}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => lock({ id })))
                },
              },
              {
                accessor: BACKUPJOB_ACTIONS.UNLOCK,
                name: T.Unlock,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Unlock,
                  dataCy: `modal-${BACKUPJOB_ACTIONS.UNLOCK}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => unlock({ id })))
                },
              },
            ],
          },
          {
            accessor: BACKUPJOB_ACTIONS.DELETE,
            tooltip: T.Delete,
            icon: Trash,
            color: 'error',
            selected: { min: 1 },
            dataCy: `backupjob_${BACKUPJOB_ACTIONS.DELETE}`,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Delete,
                  dataCy: `modal-${BACKUPJOB_ACTIONS.DELETE}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => deleteBackupJob({ id })))
                },
              },
            ],
          },
        ],
      }),
    [view]
  )
}

export default Actions
