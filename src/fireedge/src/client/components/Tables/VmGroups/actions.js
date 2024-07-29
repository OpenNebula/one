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
import { AddCircledOutline, Trash } from 'iconoir-react'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import { useViews } from 'client/features/Auth'
import {
  useLockVMGroupMutation,
  useUnlockVMGroupMutation,
  useRemoveVMGroupMutation,
} from 'client/features/OneApi/vmGroup'

import {
  createActions,
  GlobalAction,
} from 'client/components/Tables/Enhanced/Utils'

import { PATH } from 'client/apps/sunstone/routesOne'
import { Translate } from 'client/components/HOC'
import { RESOURCE_NAMES, T, VMGROUP_ACTIONS } from 'client/constants'

const ListVmGroupNames = ({ rows = [] }) =>
  rows?.map?.(({ id, original }) => {
    const { ID, NAME } = original

    return (
      <Typography
        key={`vmgroup-${id}`}
        variant="inherit"
        component="span"
        display="block"
      >
        {`#${ID} ${NAME}`}
      </Typography>
    )
  })

const MessageToConfirmAction = (rows, description) => (
  <>
    <ListVmGroupNames rows={rows} />
    {description && <Translate word={description} />}
    <Translate word={T.DoYouWantProceed} />
  </>
)

MessageToConfirmAction.displayName = 'MessageToConfirmAction'

/**
 * Generates the actions to operate resources on VmGroup table.
 *
 * @returns {GlobalAction} - Actions
 */
const Actions = () => {
  const history = useHistory()
  const { view, getResourceView } = useViews()
  const [enable] = useUnlockVMGroupMutation()
  const [remove] = useRemoveVMGroupMutation()
  const [disable] = useLockVMGroupMutation()

  return useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.VM_GROUP)?.actions,
        actions: [
          {
            accessor: VMGROUP_ACTIONS.CREATE_DIALOG,
            tooltip: T.Create,
            icon: AddCircledOutline,
            action: () => history.push(PATH.TEMPLATE.VMGROUP.CREATE),
          },
          {
            accessor: VMGROUP_ACTIONS.UPDATE_DIALOG,
            label: T.Update,
            tooltip: T.Update,
            selected: { max: 1 },
            color: 'secondary',
            action: (rows) => {
              const vmGroupTemplate = rows?.[0]?.original ?? {}
              const path = PATH.TEMPLATE.VMGROUP.CREATE

              history.push(path, vmGroupTemplate)
            },
          },
          {
            accessor: VMGROUP_ACTIONS.ENABLE,
            label: T.Enable,
            tooltip: T.Enable,
            color: 'secondary',
            selected: { min: 1 },
            dataCy: `vmgroup_${VMGROUP_ACTIONS.ENABLE}`,
            action: async (rows) => {
              const ids = rows?.map?.(({ original }) => original?.ID)
              await Promise.all(ids.map((id) => enable(id)))
            },
          },
          {
            accessor: VMGROUP_ACTIONS.DISABLE,
            label: T.Disable,
            tooltip: T.Disable,
            color: 'secondary',
            selected: { min: 1 },
            dataCy: `vmgroup_${VMGROUP_ACTIONS.DISABLE}`,
            action: async (rows) => {
              const ids = rows?.map?.(({ original }) => original?.ID)
              await Promise.all(ids.map((id) => disable(id)))
            },
          },
          {
            accessor: VMGROUP_ACTIONS.DELETE,
            tooltip: T.Delete,
            icon: Trash,
            color: 'error',
            selected: { min: 1 },
            dataCy: `vmgroup_${VMGROUP_ACTIONS.DELETE}`,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Delete,
                  dataCy: `modal-${VMGROUP_ACTIONS.DELETE}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => remove({ id })))
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
