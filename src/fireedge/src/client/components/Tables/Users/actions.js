/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
  useDisableUserMutation,
  useEnableUserMutation,
  useRemoveUserMutation,
} from 'client/features/OneApi/user'

import {
  createActions,
  GlobalAction,
} from 'client/components/Tables/Enhanced/Utils'

import { PATH } from 'client/apps/sunstone/routesOne'
import { Translate } from 'client/components/HOC'
import { RESOURCE_NAMES, T, USER_ACTIONS } from 'client/constants'

const ListUserNames = ({ rows = [] }) =>
  rows?.map?.(({ id, original }) => {
    const { ID, NAME } = original

    return (
      <Typography
        key={`user-${id}`}
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
    <ListUserNames rows={rows} />
    {description && <Translate word={description} />}
    <Translate word={T.DoYouWantProceed} />
  </>
)

MessageToConfirmAction.displayName = 'MessageToConfirmAction'

/**
 * Generates the actions to operate resources on User table.
 *
 * @returns {GlobalAction} - Actions
 */
const Actions = () => {
  const history = useHistory()
  const { view, getResourceView } = useViews()
  const [enable] = useEnableUserMutation()
  const [remove] = useRemoveUserMutation()
  const [disable] = useDisableUserMutation()

  return useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.USER)?.actions,
        actions: [
          {
            accessor: USER_ACTIONS.CREATE_DIALOG,
            tooltip: T.Create,
            icon: AddCircledOutline,
            action: () => history.push(PATH.SYSTEM.USERS.CREATE),
          },
          {
            accessor: USER_ACTIONS.DELETE,
            tooltip: T.Delete,
            icon: Trash,
            color: 'error',
            selected: { min: 1 },
            dataCy: `user_${USER_ACTIONS.DELETE}`,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Delete,
                  dataCy: `modal-${USER_ACTIONS.DELETE}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => remove({ id })))
                },
              },
            ],
          },
          {
            accessor: USER_ACTIONS.ENABLE,
            label: T.Enable,
            tooltip: T.Enable,
            color: 'secondary',
            selected: { min: 1 },
            dataCy: `user_${USER_ACTIONS.ENABLE}`,
            action: async (rows) => {
              const ids = rows?.map?.(({ original }) => original?.ID)
              await Promise.all(ids.map((id) => enable(id)))
            },
          },
          {
            accessor: USER_ACTIONS.DISABLE,
            label: T.Disable,
            tooltip: T.Disable,
            color: 'secondary',
            selected: { min: 1 },
            dataCy: `user_${USER_ACTIONS.DISABLE}`,
            action: async (rows) => {
              const ids = rows?.map?.(({ original }) => original?.ID)
              await Promise.all(ids.map((id) => disable(id)))
            },
          },
        ],
      }),
    [view]
  )
}

export default Actions
