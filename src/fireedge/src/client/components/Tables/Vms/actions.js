/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { useHistory } from 'react-router-dom'
import { Typography } from '@mui/material'
import {
  RefreshDouble,
  AddSquare,
  PlayOutline,
  SaveFloppyDisk,
  TransitionRight,
  SystemShut,
  Group,
  Trash,
  Lock,
  Cart
} from 'iconoir-react'

import { useAuth } from 'client/features/Auth'
import { useVmApi } from 'client/features/One'
import { Translate } from 'client/components/HOC'

import { RecoverForm, ChangeUserForm, ChangeGroupForm } from 'client/components/Forms/Vm'
import { createActions } from 'client/components/Tables/Enhanced/Utils'
import { PATH } from 'client/apps/sunstone/routesOne'
import { T, VM_ACTIONS, MARKETPLACE_APP_ACTIONS, VM_ACTIONS_BY_STATE } from 'client/constants'

const isDisabled = action => rows => {
  if (VM_ACTIONS_BY_STATE[action]?.length === 0) return false

  const states = rows?.map?.(({ values }) => values?.STATE)

  return states.some(state => !VM_ACTIONS_BY_STATE[action]?.includes(state))
}

const ListVmNames = ({ rows = [] }) => (
  <Typography>
    <Translate word={T.VMs} />
    {`: ${rows?.map?.(({ original }) => original?.NAME).join(', ')}`}
  </Typography>
)

const SubHeader = rows => {
  const isMultiple = rows?.length > 1
  const firstRow = rows?.[0]?.original

  return isMultiple
    ? <ListVmNames rows={rows} />
    : <>{`#${firstRow?.ID} ${firstRow?.NAME}`}</>
}

const MessageToConfirmAction = rows => (
  <>
    <ListVmNames rows={rows} />
    <Translate word={T.DoYouWantProceed} />
  </>
)

ListVmNames.displayName = 'ListVmNames'
SubHeader.displayName = 'SubHeader'
MessageToConfirmAction.displayName = 'MessageToConfirmAction'

const Actions = () => {
  const history = useHistory()
  const { view, getResourceView } = useAuth()
  const {
    getVm,
    getVms,
    terminate,
    terminateHard,
    undeploy,
    undeployHard,
    poweroff,
    poweroffHard,
    reboot,
    rebootHard,
    hold,
    release,
    stop,
    suspend,
    resume,
    resched,
    unresched,
    recover,
    changeOwnership,
    lock,
    unlock
  } = useVmApi()

  const vmActions = useMemo(() => createActions({
    filters: getResourceView('VM')?.actions,
    actions: [
      {
        accessor: VM_ACTIONS.REFRESH,
        tooltip: T.Refresh,
        icon: RefreshDouble,
        action: async () => {
          await getVms({ state: -1 })
        }
      },
      {
        accessor: VM_ACTIONS.CREATE_DIALOG,
        tooltip: T.Create,
        icon: AddSquare,
        action: () => {
          const path = PATH.TEMPLATE.VMS.INSTANTIATE

          history.push(path)
        }
      },
      {
        accessor: VM_ACTIONS.RESUME,
        disabled: isDisabled(VM_ACTIONS.RESUME),
        tooltip: T.Resume,
        selected: true,
        icon: PlayOutline,
        action: async rows => {
          const ids = rows?.map?.(({ original }) => original?.ID)
          await Promise.all(ids.map(id => resume(id)))
          ids?.length > 1 && (await Promise.all(ids.map(id => getVm(id))))
        }
      },
      {
        accessor: VM_ACTIONS.SAVE_AS_TEMPLATE,
        disabled: isDisabled(VM_ACTIONS.SAVE_AS_TEMPLATE),
        tooltip: T.SaveAsTemplate,
        selected: { max: 1 },
        icon: SaveFloppyDisk,
        action: () => {}
      },
      {
        tooltip: T.Manage,
        icon: SystemShut,
        selected: true,
        color: 'secondary',
        options: [{
          accessor: VM_ACTIONS.SUSPEND,
          disabled: isDisabled(VM_ACTIONS.SUSPEND),
          name: T.Suspend,
          isConfirmDialog: true,
          dialogProps: {
            title: T.Suspend,
            children: MessageToConfirmAction
          },
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => suspend(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          accessor: VM_ACTIONS.STOP,
          disabled: isDisabled(VM_ACTIONS.STOP),
          name: T.Stop,
          isConfirmDialog: true,
          dialogProps: {
            title: T.Stop,
            children: MessageToConfirmAction
          },
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => stop(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          accessor: VM_ACTIONS.POWEROFF,
          disabled: isDisabled(VM_ACTIONS.POWEROFF),
          name: T.Poweroff,
          isConfirmDialog: true,
          dialogProps: {
            title: T.Poweroff,
            children: MessageToConfirmAction
          },
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => poweroff(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          accessor: VM_ACTIONS.POWEROFF_HARD,
          disabled: isDisabled(VM_ACTIONS.POWEROFF_HARD),
          name: T.PoweroffHard,
          isConfirmDialog: true,
          dialogProps: {
            title: T.PoweroffHard,
            children: MessageToConfirmAction
          },
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => poweroffHard(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          accessor: VM_ACTIONS.REBOOT,
          disabled: isDisabled(VM_ACTIONS.REBOOT),
          name: T.Reboot,
          isConfirmDialog: true,
          dialogProps: {
            title: T.Reboot,
            children: MessageToConfirmAction
          },
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => reboot(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          accessor: VM_ACTIONS.REBOOT_HARD,
          disabled: isDisabled(VM_ACTIONS.REBOOT_HARD),
          name: T.RebootHard,
          isConfirmDialog: true,
          dialogProps: {
            title: T.RebootHard,
            children: MessageToConfirmAction
          },
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => rebootHard(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          accessor: VM_ACTIONS.UNDEPLOY,
          disabled: isDisabled(VM_ACTIONS.UNDEPLOY),
          name: T.Undeploy,
          isConfirmDialog: true,
          dialogProps: {
            title: T.Undeploy,
            children: MessageToConfirmAction
          },
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => undeploy(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          accessor: VM_ACTIONS.UNDEPLOY_HARD,
          disabled: isDisabled(VM_ACTIONS.UNDEPLOY_HARD),
          name: T.UndeployHard,
          isConfirmDialog: true,
          dialogProps: {
            title: T.UndeployHard,
            children: MessageToConfirmAction
          },
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => undeployHard(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }]
      },
      {
        tooltip: T.Host,
        icon: TransitionRight,
        selected: true,
        color: 'secondary',
        options: [{
          accessor: VM_ACTIONS.DEPLOY,
          disabled: isDisabled(VM_ACTIONS.DEPLOY),
          name: T.Deploy,
          form: () => undefined,
          onSubmit: () => undefined
        }, {
          accessor: VM_ACTIONS.MIGRATE,
          disabled: isDisabled(VM_ACTIONS.MIGRATE),
          name: T.Migrate,
          form: () => undefined,
          onSubmit: () => undefined
        }, {
          accessor: VM_ACTIONS.MIGRATE_LIVE,
          disabled: isDisabled(VM_ACTIONS.MIGRATE_LIVE),
          name: T.MigrateLive,
          form: () => undefined,
          onSubmit: () => undefined
        }, {
          accessor: VM_ACTIONS.HOLD,
          disabled: isDisabled(VM_ACTIONS.HOLD),
          name: T.Hold,
          isConfirmDialog: true,
          dialogProps: {
            title: T.Hold,
            children: MessageToConfirmAction
          },
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => hold(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          accessor: VM_ACTIONS.RELEASE,
          disabled: isDisabled(VM_ACTIONS.RELEASE),
          name: T.Release,
          isConfirmDialog: true,
          dialogProps: {
            title: T.Release,
            children: MessageToConfirmAction
          },
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => release(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          accessor: VM_ACTIONS.RESCHED,
          disabled: isDisabled(VM_ACTIONS.RESCHED),
          name: T.Reschedule,
          isConfirmDialog: true,
          dialogProps: {
            title: T.Reschedule,
            children: MessageToConfirmAction
          },
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => resched(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          accessor: VM_ACTIONS.UNRESCHED,
          disabled: isDisabled(VM_ACTIONS.UNRESCHED),
          name: T.UnReschedule,
          isConfirmDialog: true,
          dialogProps: {
            title: T.UnReschedule,
            children: MessageToConfirmAction
          },
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => unresched(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          accessor: VM_ACTIONS.RECOVER,
          disabled: isDisabled(VM_ACTIONS.RECOVER),
          name: T.Recover,
          dialogProps: {
            title: T.Recover,
            subheader: SubHeader
          },
          form: RecoverForm,
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => recover(id)))
            ids?.length > 1 && await Promise.all(ids.map(id => getVm(id)))
          }
        }]
      },
      {
        tooltip: T.Ownership,
        icon: Group,
        selected: true,
        color: 'secondary',
        options: [{
          accessor: VM_ACTIONS.CHANGE_OWNER,
          disabled: isDisabled(VM_ACTIONS.CHANGE_OWNER),
          name: T.ChangeOwner,
          dialogProps: {
            title: T.ChangeOwner,
            subheader: SubHeader
          },
          form: ChangeUserForm,
          onSubmit: async (newOwnership, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => changeOwnership(id, newOwnership)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          accessor: VM_ACTIONS.CHANGE_GROUP,
          disabled: isDisabled(VM_ACTIONS.CHANGE_GROUP),
          name: T.ChangeGroup,
          dialogProps: {
            title: T.ChangeGroup,
            subheader: SubHeader
          },
          form: ChangeGroupForm,
          onSubmit: async (newOwnership, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => changeOwnership(id, newOwnership)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }]
      },
      {
        tooltip: T.Lock,
        icon: Lock,
        selected: true,
        color: 'secondary',
        options: [{
          accessor: VM_ACTIONS.LOCK,
          disabled: isDisabled(VM_ACTIONS.LOCK),
          name: T.Lock,
          isConfirmDialog: true,
          dialogProps: {
            title: T.Lock,
            children: MessageToConfirmAction
          },
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => lock(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          accessor: VM_ACTIONS.UNLOCK,
          disabled: isDisabled(VM_ACTIONS.UNLOCK),
          name: T.Unlock,
          isConfirmDialog: true,
          dialogProps: {
            title: T.Unlock,
            children: MessageToConfirmAction
          },
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => unlock(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }]
      },
      {
        tooltip: T.Terminate,
        icon: Trash,
        color: 'error',
        selected: true,
        options: [{
          accessor: VM_ACTIONS.TERMINATE,
          disabled: isDisabled(VM_ACTIONS.TERMINATE),
          name: T.Terminate,
          isConfirmDialog: true,
          dialogProps: {
            title: T.Terminate,
            children: MessageToConfirmAction
          },
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => terminate(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          accessor: VM_ACTIONS.TERMINATE_HARD,
          name: T.TerminateHard,
          isConfirmDialog: true,
          disabled: isDisabled(VM_ACTIONS.TERMINATE_HARD),
          dialogProps: {
            title: T.TerminateHard,
            children: MessageToConfirmAction
          },
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => terminateHard(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }]
      }
    ]
  }), [view])

  const marketplaceAppActions = useMemo(() => createActions({
    filters: getResourceView('MARKETPLACE-APP')?.actions,
    actions: [
      {
        accessor: MARKETPLACE_APP_ACTIONS.CREATE_DIALOG,
        tooltip: T.CreateMarketApp,
        icon: Cart,
        selected: { max: 1 },
        disabled: true,
        action: rows => {
          // TODO: go to Marketplace App CREATE form
        }
      }
    ]
  }), [view])

  return [...vmActions, ...marketplaceAppActions]
}

export default Actions
