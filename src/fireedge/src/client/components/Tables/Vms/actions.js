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
import { Tr } from 'client/components/HOC'

// import {  } from 'client/components/Forms/Vm'
import { createActions } from 'client/components/Tables/Enhanced/Utils'
import { PATH } from 'client/apps/sunstone/routesOne'
import { T, VM_ACTIONS, MARKETPLACE_APP_ACTIONS } from 'client/constants'

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
        tooltip: T.Resume,
        selected: true,
        icon: PlayOutline,
        action: async rows => {
          const ids = rows?.map?.(({ original }) => original?.ID)
          await Promise.all(ids.map(id => resume(id)))
          await Promise.all(ids.map(id => getVm(id)))
        }
      },
      {
        accessor: VM_ACTIONS.SAVE_AS_TEMPLATE,
        tooltip: T.SaveAsTemplate,
        selected: { max: 1 },
        disabled: true,
        icon: SaveFloppyDisk,
        action: () => {}
      },
      {
        tooltip: T.Manage,
        icon: SystemShut,
        selected: true,
        options: [{
          cy: `action.${VM_ACTIONS.SUSPEND}`,
          name: T.Suspend,
          isConfirmDialog: true,
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => suspend(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          cy: `action.${VM_ACTIONS.STOP}`,
          name: T.Stop,
          isConfirmDialog: true,
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => stop(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          cy: `action.${VM_ACTIONS.POWEROFF}`,
          name: T.Poweroff,
          isConfirmDialog: true,
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => poweroff(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          cy: `action.${VM_ACTIONS.POWEROFF_HARD}`,
          name: T.PoweroffHard,
          isConfirmDialog: true,
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => poweroffHard(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          cy: `action.${VM_ACTIONS.REBOOT}`,
          name: T.Reboot,
          isConfirmDialog: true,
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => reboot(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          cy: `action.${VM_ACTIONS.REBOOT_HARD}`,
          name: T.RebootHard,
          isConfirmDialog: true,
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => rebootHard(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          cy: `action.${VM_ACTIONS.UNDEPLOY}`,
          name: T.Undeploy,
          isConfirmDialog: true,
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => undeploy(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          cy: `action.${VM_ACTIONS.UNDEPLOY_HARD}`,
          name: T.UndeployHard,
          isConfirmDialog: true,
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => undeployHard(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }]
      },
      {
        tooltip: 'Hosting',
        icon: TransitionRight,
        selected: true,
        options: [{
          cy: `action.${VM_ACTIONS.DEPLOY}`,
          name: T.Deploy,
          disabled: true,
          isConfirmDialog: true,
          onSubmit: () => undefined
        }, {
          cy: `action.${VM_ACTIONS.MIGRATE}`,
          name: T.Migrate,
          disabled: true,
          isConfirmDialog: true,
          onSubmit: () => undefined
        }, {
          cy: `action.${VM_ACTIONS.MIGRATE_LIVE}`,
          name: T.MigrateLive,
          disabled: true,
          isConfirmDialog: true,
          onSubmit: () => undefined
        }, {
          cy: `action.${VM_ACTIONS.HOLD}`,
          name: T.Hold,
          isConfirmDialog: true,
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => hold(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          cy: `action.${VM_ACTIONS.RELEASE}`,
          name: T.Release,
          isConfirmDialog: true,
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => release(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          cy: `action.${VM_ACTIONS.RESCHED}`,
          name: T.Reschedule,
          isConfirmDialog: true,
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => resched(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          cy: `action.${VM_ACTIONS.UNRESCHED}`,
          name: T.UnReschedule,
          isConfirmDialog: true,
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => unresched(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          cy: `action.${VM_ACTIONS.RECOVER}`,
          name: T.Recover,
          disabled: true,
          isConfirmDialog: true,
          onSubmit: () => undefined
        }]
      },
      {
        tooltip: 'Change ownership',
        icon: Group,
        selected: true,
        options: [{
          cy: `action.${VM_ACTIONS.CHANGE_OWNER}`,
          name: T.ChangeOwner,
          disabled: true,
          isConfirmDialog: true,
          onSubmit: () => undefined
        }, {
          cy: `action.${VM_ACTIONS.CHANGE_GROUP}`,
          name: T.ChangeGroup,
          disabled: true,
          isConfirmDialog: true,
          onSubmit: () => undefined
        }]
      },
      {
        tooltip: `${Tr(T.Lock)}/${Tr(T.Unlock)}`,
        icon: Lock,
        selected: true,
        options: [{
          cy: `action.${VM_ACTIONS.LOCK}`,
          name: T.Lock,
          isConfirmDialog: true,
          dialogProps: {
            title: T.Lock,
            children: rows => {
              const templates = rows?.map?.(({ original }) => original?.NAME)
              return 'VMs: ' + templates.join(', ')
            }
          },
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => lock(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          cy: `action.${VM_ACTIONS.UNLOCK}`,
          name: T.Unlock,
          isConfirmDialog: true,
          dialogProps: {
            title: T.Unlock,
            children: rows => {
              const templates = rows?.map?.(({ original }) => original?.NAME)
              return 'VMs: ' + templates.join(', ')
            }
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
        selected: true,
        options: [{
          cy: `action.${VM_ACTIONS.TERMINATE}`,
          name: T.Terminate,
          isConfirmDialog: true,
          dialogProps: {
            title: T.Terminate,
            children: rows => {
              const templates = rows?.map?.(({ original }) => original?.NAME)
              return 'VMs: ' + templates.join(', ')
            }
          },
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => terminate(id)))
            await Promise.all(ids.map(id => getVm(id)))
          }
        }, {
          cy: `action.${VM_ACTIONS.TERMINATE_HARD}`,
          name: T.TerminateHard,
          isConfirmDialog: true,
          dialogProps: {
            title: T.TerminateHard,
            children: rows => {
              const templates = rows?.map?.(({ original }) => original?.NAME)
              return 'VMs: ' + templates.join(', ')
            }
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
        tooltip: 'Create Marketplace App',
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
