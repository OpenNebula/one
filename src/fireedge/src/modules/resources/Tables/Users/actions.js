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
import { Typography } from '@mui/material'
import { Plus, Trash } from 'iconoir-react'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import { useGeneralApi, UserAPI, useViews } from '@FeaturesModule'

import {
  createActions,
  GlobalAction,
} from '@modules/resources/Tables/Enhanced/Utils'

import { RESOURCE_NAMES, T, USER_ACTIONS, PATH } from '@ConstantsModule'
import { Translate } from '@ProvidersModule'
const { useDisableUserMutation, useEnableUserMutation, useRemoveUserMutation } =
  UserAPI

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
        <strong>{`#${ID} ${NAME}`}</strong>
      </Typography>
    )
  })

const MessageToConfirmAction = (rows, description) => (
  <>
    <ListUserNames rows={rows} />
    {description && <Translate word={description} />}
    <Translate word={T?.['user.delete.confirmation']} />
  </>
)

MessageToConfirmAction.displayName = 'MessageToConfirmAction'

/**
 * Generates the actions to operate resources on User table.
 *
 * @param {object} props - datatable props
 * @param {Function} props.setSelectedRows - set selected rows
 * @returns {GlobalAction} - Actions
 */
const Actions = (props = {}) => {
  const { setSelectedRows } = props
  const history = useHistory()
  const { view, getResourceView } = useViews()
  const [enable] = useEnableUserMutation()
  const [remove] = useRemoveUserMutation()
  const [disable] = useDisableUserMutation()
  const { enqueueSuccess, enqueueError } = useGeneralApi()

  return useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.USER)?.actions,
        actions: [
          {
            accessor: USER_ACTIONS.CREATE_DIALOG,
            tooltip: T.Create,
            label: T.Create,
            iconOnly: Plus,
            action: () => {
              history.push(PATH.SYSTEM.USERS.CREATE)
            },
          },
          {
            accessor: USER_ACTIONS.ENABLE,
            label: T.Enable,
            tooltip: T.Enable,
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
            selected: { min: 1 },
            dataCy: `user_${USER_ACTIONS.DISABLE}`,
            action: async (rows) => {
              const ids = rows?.map?.(({ original }) => original?.ID)
              await Promise.all(ids.map((id) => disable(id)))
            },
          },
          {
            accessor: USER_ACTIONS.DELETE,
            tooltip: T.Delete,
            iconOnly: Trash,
            selected: { min: 1 },
            dataCy: `user_${USER_ACTIONS.DELETE}`,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T?.['user.delete'],
                  dataCy: `modal-${USER_ACTIONS.DELETE}`,
                  description: MessageToConfirmAction,
                  confirmLabel: T.Delete,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  const results = await Promise.allSettled(
                    ids?.map((id) => remove({ id }))
                  )

                  const failed = results.filter(
                    ({ status }) => status === 'rejected'
                  )

                  if (failed?.length) {
                    enqueueError(`Failed to delete ${failed?.length} users`)
                  } else {
                    enqueueSuccess(`Deleted ${results?.length} users`)
                  }

                  setSelectedRows && setSelectedRows([])
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
