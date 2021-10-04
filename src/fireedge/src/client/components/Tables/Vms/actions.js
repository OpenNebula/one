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
import { Tr, Translate } from 'client/components/HOC'

import { RecoverForm } from 'client/components/Forms/Vm'
import { createActions } from 'client/components/Tables/Enhanced/Utils'
import { PATH } from 'client/apps/sunstone/routesOne'
import { T, VM_ACTIONS, MARKETPLACE_APP_ACTIONS, VM_ACTIONS_BY_STATE } from 'client/constants'

const isDisabled = action => rows => {
  if (VM_ACTIONS_BY_STATE[action]?.length === 0) return false

  const states = rows?.map?.(({ values }) => values?.STATE)

  return states.some(state => !VM_ACTIONS_BY_STATE[action]?.includes(state))
}

const MessageToConfirmAction = rows => {
  const names = rows?.map?.(({ original }) => original?.NAME)

  return (
    <>
      <p>
        <Translate word={T.VMs} />
        {`: ${names.join(', ')}`}
      </p>
      <p>
        <Translate word={T.DoYouWantProceed} />
      </p>
    </>
  )
}

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
    lock,
    unlock
  } = useVmApi()

  const vmActions = useMemo(() => createActions({
    filters: getResourceView('VM')?.actions,
    actions: [
      {
        accessor: VM_ACTIONS.REFRESH,
        tooltip: Tr(T.Refresh),
        icon: RefreshDouble,
        action: async () => {
          await getVms({ state: -1 })
        }
      },
      {
        accessor: VM_ACTIONS.CREATE_DIALOG,
        tooltip: Tr(T.Create),
        icon: AddSquare,
        action: () => {
          const path = PATH.TEMPLATE.VMS.INSTANTIATE

          history.push(path)
        }
      },
      {
        accessor: VM_ACTIONS.RESUME,
        tooltip: Tr(T.Resume),
        selected: true,
        disabled: isDisabled(VM_ACTIONS.RESUME),
        icon: PlayOutline,
        action: async rows => {
          const ids = rows?.map?.(({ original }) => original?.ID)
          await Promise.all(ids.map(id => resume(id)))
          ids?.length > 1 && await Promise.all(ids.map(id => getVm(id)))
        }
      },
      {
        accessor: VM_ACTIONS.SAVE_AS_TEMPLATE,
        tooltip: Tr(T.SaveAsTemplate),
        selected: { max: 1 },
        disabled: isDisabled(VM_ACTIONS.SAVE_AS_TEMPLATE),
        icon: SaveFloppyDisk,
        action: () => {}
      },
      {
        tooltip: Tr(T.Manage),
        icon: SystemShut,
        selected: true,
        options: [{
          accessor: VM_ACTIONS.SUSPEND,
          name: T.Suspend,
          disabled: isDisabled(VM_ACTIONS.SUSPEND),
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
          name: T.Stop,
          disabled: isDisabled(VM_ACTIONS.STOP),
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
          name: T.Poweroff,
          disabled: isDisabled(VM_ACTIONS.POWEROFF),
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
          name: T.PoweroffHard,
          disabled: isDisabled(VM_ACTIONS.POWEROFF_HARD),
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
          name: T.Reboot,
          disabled: isDisabled(VM_ACTIONS.REBOOT),
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
          name: T.RebootHard,
          disabled: isDisabled(VM_ACTIONS.REBOOT_HARD),
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
          name: T.Undeploy,
          disabled: isDisabled(VM_ACTIONS.UNDEPLOY),
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
          name: T.UndeployHard,
          disabled: isDisabled(VM_ACTIONS.UNDEPLOY_HARD),
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
        tooltip: Tr(T.Host),
        icon: TransitionRight,
        selected: true,
        options: [{
          accessor: VM_ACTIONS.DEPLOY,
          name: T.Deploy,
          disabled: isDisabled(VM_ACTIONS.DEPLOY),
          isConfirmDialog: true,
          onSubmit: () => undefined
        }, {
          accessor: VM_ACTIONS.MIGRATE,
          name: T.Migrate,
          disabled: isDisabled(VM_ACTIONS.MIGRATE),
          isConfirmDialog: true,
          onSubmit: () => undefined
        }, {
          accessor: VM_ACTIONS.MIGRATE_LIVE,
          name: T.MigrateLive,
          disabled: isDisabled(VM_ACTIONS.MIGRATE_LIVE),
          isConfirmDialog: true,
          onSubmit: () => undefined
        }, {
          accessor: VM_ACTIONS.HOLD,
          name: T.Hold,
          disabled: isDisabled(VM_ACTIONS.HOLD),
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
          name: T.Release,
          disabled: isDisabled(VM_ACTIONS.RELEASE),
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
          name: T.Reschedule,
          disabled: isDisabled(VM_ACTIONS.RESCHED),
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
          name: T.UnReschedule,
          disabled: isDisabled(VM_ACTIONS.UNRESCHED),
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
          name: T.Recover,
          disabled: isDisabled(VM_ACTIONS.RECOVER),
          dialogProps: {
            title: rows => {
              const isMultiple = rows?.length > 1
              const { ID, NAME } = rows?.[0]?.original

              return [
                Tr(isMultiple ? T.RecoverSeveralVMs : T.Recover),
                !isMultiple && `#${ID} ${NAME}`
              ].filter(Boolean).join(' - ')
            }
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
        tooltip: Tr(T.Ownership),
        icon: Group,
        selected: true,
        options: [{
          accessor: VM_ACTIONS.CHANGE_OWNER,
          name: T.ChangeOwner,
          disabled: isDisabled(VM_ACTIONS.CHANGE_OWNER),
          isConfirmDialog: true,
          onSubmit: () => undefined
        }, {
          accessor: VM_ACTIONS.CHANGE_GROUP,
          name: T.ChangeGroup,
          disabled: isDisabled(VM_ACTIONS.CHANGE_GROUP),
          isConfirmDialog: true,
          onSubmit: () => undefined
        }]
      },
      {
        tooltip: `${Tr(T.Lock)}/${Tr(T.Unlock)}`,
        icon: Lock,
        selected: true,
        options: [{
          accessor: VM_ACTIONS.LOCK,
          name: T.Lock,
          disabled: isDisabled(VM_ACTIONS.LOCK),
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
          name: T.Unlock,
          disabled: isDisabled(VM_ACTIONS.UNLOCK),
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
        tooltip: Tr(T.Terminate),
        icon: Trash,
        selected: true,
        options: [{
          accessor: VM_ACTIONS.TERMINATE,
          name: T.Terminate,
          disabled: isDisabled(VM_ACTIONS.TERMINATE),
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
        tooltip: Tr(T.CreateMarketApp),
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
