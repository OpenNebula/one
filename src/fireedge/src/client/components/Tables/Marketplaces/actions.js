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
import { AddCircledOutline, Trash, MoreVert, Group } from 'iconoir-react'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import { useViews } from 'client/features/Auth'
import {
  useRemoveMarketplaceMutation,
  useEnableMarketplaceMutation,
  useDisableMarketplaceMutation,
  useChangeMarketplaceOwnershipMutation,
} from 'client/features/OneApi/marketplace'

import {
  createActions,
  GlobalAction,
} from 'client/components/Tables/Enhanced/Utils'

import { PATH } from 'client/apps/sunstone/routesOne'
import { Translate } from 'client/components/HOC'
import { RESOURCE_NAMES, T, MARKETPLACE_ACTIONS } from 'client/constants'
import { ChangeGroupForm, ChangeUserForm } from 'client/components/Forms/Vm'

const ListMarketplaceNames = ({ rows = [] }) =>
  rows?.map?.(({ id, original }) => {
    const { ID, NAME } = original

    return (
      <Typography
        key={`group-${id}`}
        variant="inherit"
        component="span"
        display="block"
      >
        {`#${ID} ${NAME}`}
      </Typography>
    )
  })

const SubHeader = (rows) => <ListMarketplaceNames rows={rows} />

const MessageToConfirmAction = (rows, description) => (
  <>
    <ListMarketplaceNames rows={rows} />
    {description && <Translate word={description} />}
    <Translate word={T.DoYouWantProceed} />
  </>
)

MessageToConfirmAction.displayName = 'MessageToConfirmAction'

/**
 * Generates the actions to operate resources on Groups table.
 *
 * @returns {GlobalAction} - Actions
 */
const Actions = () => {
  const history = useHistory()
  const { view, getResourceView } = useViews()
  const [remove] = useRemoveMarketplaceMutation()
  const [enable] = useEnableMarketplaceMutation()
  const [disable] = useDisableMarketplaceMutation()
  const [changeOwnership] = useChangeMarketplaceOwnershipMutation()

  return useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.MARKETPLACE)?.actions,
        actions: [
          {
            accessor: MARKETPLACE_ACTIONS.CREATE_DIALOG,
            tooltip: T.Create,
            icon: AddCircledOutline,
            action: () => history.push(PATH.STORAGE.MARKETPLACES.CREATE),
          },
          {
            accessor: MARKETPLACE_ACTIONS.UPDATE_DIALOG,
            label: T.Update,
            tooltip: T.Update,
            selected: { max: 1 },
            color: 'secondary',
            action: (rows) => {
              const group = rows?.[0]?.original ?? {}
              const path = PATH.STORAGE.MARKETPLACES.CREATE

              history.push(path, group)
            },
          },
          {
            tooltip: T.Enable,
            icon: MoreVert,
            selected: true,
            color: 'secondary',
            dataCy: 'marketplace-enable',
            options: [
              {
                accessor: MARKETPLACE_ACTIONS.ENABLE,
                name: T.Enable,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Enable,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${MARKETPLACE_ACTIONS.ENABLE}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => enable({ id })))
                },
              },
              {
                accessor: MARKETPLACE_ACTIONS.DISABLE,
                name: T.Disable,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Disable,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${MARKETPLACE_ACTIONS.DISABLE}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => disable({ id })))
                },
              },
            ],
          },
          {
            tooltip: T.Ownership,
            icon: Group,
            selected: true,
            color: 'secondary',
            dataCy: 'marketplace-ownership',
            options: [
              {
                accessor: MARKETPLACE_ACTIONS.CHANGE_OWNER,
                name: T.ChangeOwner,
                dialogProps: {
                  title: T.ChangeOwner,
                  subheader: SubHeader,
                  dataCy: `modal-${MARKETPLACE_ACTIONS.CHANGE_OWNER}`,
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
                accessor: MARKETPLACE_ACTIONS.CHANGE_GROUP,
                name: T.ChangeGroup,
                dialogProps: {
                  title: T.ChangeGroup,
                  subheader: SubHeader,
                  dataCy: `modal-${MARKETPLACE_ACTIONS.CHANGE_GROUP}`,
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
            accessor: MARKETPLACE_ACTIONS.DELETE,
            tooltip: T.Delete,
            icon: Trash,
            color: 'error',
            selected: { min: 1 },
            dataCy: `marketplace_${MARKETPLACE_ACTIONS.DELETE}`,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Delete,
                  dataCy: `modal-${MARKETPLACE_ACTIONS.DELETE}`,
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
