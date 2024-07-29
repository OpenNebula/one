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
import { AddCircledOutline, DesignPencil, Trash } from 'iconoir-react'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import { useViews } from 'client/features/Auth'
import { useRemoveAclMutation } from 'client/features/OneApi/acl'

import {
  createActions,
  GlobalAction,
} from 'client/components/Tables/Enhanced/Utils'

import { PATH } from 'client/apps/sunstone/routesOne'
import { Translate, Tr } from 'client/components/HOC'
import { RESOURCE_NAMES, T, ACL_ACTIONS } from 'client/constants'

import { translateACL } from 'client/models/ACL'

const ListACLNames = ({ rows = [] }) =>
  rows?.map?.(({ id, original }) => {
    const { ID, STRING } = original
    const translatedString = translateACL(STRING)

    return (
      <Typography
        key={`acl-${id}`}
        variant="inherit"
        component="span"
        display="block"
      >
        {Tr(T['acls.form.delete.rule'])} <b>#{ID}</b>{' '}
        {Tr(T['acls.form.delete.means'])} <b>{translatedString}</b>
      </Typography>
    )
  })

const MessageToConfirmAction = (rows, description) => (
  <>
    <ListACLNames rows={rows} />
    {description && <Translate word={description} />}
    <Translate word={T.DoYouWantProceed} />
  </>
)

MessageToConfirmAction.displayName = 'MessageToConfirmAction'

/**
 * Generates the actions to operate resources on ACL table.
 *
 * @returns {GlobalAction} - Actions
 */
const Actions = () => {
  const history = useHistory()
  const { view, getResourceView } = useViews()
  const [remove] = useRemoveAclMutation()

  return useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.ACL)?.actions,
        actions: [
          {
            accessor: ACL_ACTIONS.CREATE_DIALOG,
            tooltip: T.Create,
            icon: AddCircledOutline,
            action: () => history.push(PATH.SYSTEM.ACLS.CREATE, false),
          },
          {
            accessor: ACL_ACTIONS.CREATE_DIALOG_STRING,
            tooltip: T['acls.table.actions.create.string'],
            icon: DesignPencil,
            action: () => history.push(PATH.SYSTEM.ACLS.CREATE, true),
          },
          {
            accessor: ACL_ACTIONS.DELETE,
            tooltip: T.Delete,
            icon: Trash,
            color: 'error',
            selected: { min: 1 },
            dataCy: `acl_${ACL_ACTIONS.DELETE}`,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Delete,
                  dataCy: `modal-${ACL_ACTIONS.DELETE}`,
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
