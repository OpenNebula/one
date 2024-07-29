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
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { Typography } from '@mui/material'
import { AddCircledOutline, Trash, Lock, Group } from 'iconoir-react'

import { useViews } from 'client/features/Auth'
import {
  useLockTemplateMutation,
  useUnlockTemplateMutation,
  useChangeTemplateOwnershipMutation,
  useChangeTemplatePermissionsMutation,
} from 'client/features/OneApi/vmTemplate'

import { useDeleteVRouterMutation } from 'client/features/OneApi/vrouter'

import { ChangeUserForm, ChangeGroupForm } from 'client/components/Forms/Vm'
import {
  createActions,
  GlobalAction,
} from 'client/components/Tables/Enhanced/Utils'

import { Tr, Translate } from 'client/components/HOC'
import { PATH } from 'client/apps/sunstone/routesOne'
import { T, VROUTER_ACTIONS, RESOURCE_NAMES } from 'client/constants'

const ListVmTemplateNames = ({ rows = [] }) =>
  rows?.map?.(({ id, original }) => {
    const { ID, NAME } = original

    return (
      <Typography
        key={`vm-template-${id}`}
        variant="inherit"
        component="span"
        display="block"
      >
        {`#${ID} ${NAME}`}
      </Typography>
    )
  })

const SubHeader = (rows) => <ListVmTemplateNames rows={rows} />

const MessageToConfirmAction = (rows, description) => (
  <>
    <ListVmTemplateNames rows={rows} />
    {description && <Translate word={description} />}
    <Translate word={T.DoYouWantProceed} />
  </>
)

MessageToConfirmAction.displayName = 'MessageToConfirmAction'

/**
 * Generates the actions to operate resources on VM Template table.
 *
 * @returns {GlobalAction} - Actions
 */
const Actions = () => {
  const history = useHistory()
  const { view, getResourceView } = useViews()

  const [lock] = useLockTemplateMutation()
  const [unlock] = useUnlockTemplateMutation()
  const [remove] = useDeleteVRouterMutation()
  const [changeOwnership] = useChangeTemplateOwnershipMutation()
  const [changePermissions] = useChangeTemplatePermissionsMutation()

  return useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.VROUTER)?.actions,
        actions: [
          {
            accessor: VROUTER_ACTIONS.INSTANTIATE_DIALOG,
            tooltip: T.Instantiate,
            icon: AddCircledOutline,
            action: () => history.push(PATH.INSTANCE.VROUTERS.INSTANTIATE),
          },
          {
            tooltip: T.Ownership,
            icon: Group,
            selected: true,
            color: 'secondary',
            dataCy: 'template-ownership',
            options: [
              {
                accessor: VROUTER_ACTIONS.CHANGE_OWNER,
                name: T.ChangeOwner,
                dialogProps: {
                  title: T.ChangeOwner,
                  subheader: SubHeader,
                  dataCy: `modal-${VROUTER_ACTIONS.CHANGE_OWNER}`,
                },
                form: ChangeUserForm,
                onSubmit: (rows) => (newOwnership) => {
                  rows?.map?.(({ original }) =>
                    changeOwnership({ id: original?.ID, ...newOwnership })
                  )
                },
              },
              {
                accessor: VROUTER_ACTIONS.CHANGE_GROUP,
                name: T.ChangeGroup,
                dialogProps: {
                  title: T.ChangeGroup,
                  subheader: SubHeader,
                  dataCy: `modal-${VROUTER_ACTIONS.CHANGE_GROUP}`,
                },
                form: ChangeGroupForm,
                onSubmit: (rows) => async (newOwnership) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => changeOwnership({ id, ...newOwnership }))
                  )
                },
              },
              {
                accessor: VROUTER_ACTIONS.SHARE,
                name: T.Share,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Share,
                  dataCy: `modal-${VROUTER_ACTIONS.SHARE}`,
                  children: (rows) =>
                    MessageToConfirmAction(rows, T.ShareVmTemplateDescription),
                },
                onSubmit: (rows) => () => {
                  rows?.map?.(({ original }) =>
                    changePermissions({ id: original?.ID, groupUse: '1' })
                  )
                },
              },
              {
                accessor: VROUTER_ACTIONS.UNSHARE,
                name: T.Unshare,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Unshare,
                  dataCy: `modal-${VROUTER_ACTIONS.UNSHARE}`,
                  children: (rows) =>
                    MessageToConfirmAction(
                      rows,
                      T.UnshareVmTemplateDescription
                    ),
                },
                onSubmit: (rows) => () => {
                  rows?.map?.(({ original }) =>
                    changePermissions({ id: original?.ID, groupUse: '0' })
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
            dataCy: 'template-lock',
            options: [
              {
                accessor: VROUTER_ACTIONS.LOCK,
                name: T.Lock,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Lock,
                  dataCy: `modal-${VROUTER_ACTIONS.LOCK}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => lock({ id })))
                },
              },
              {
                accessor: VROUTER_ACTIONS.UNLOCK,
                name: T.Unlock,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Unlock,
                  dataCy: `modal-${VROUTER_ACTIONS.UNLOCK}`,
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
            accessor: VROUTER_ACTIONS.DELETE,
            tooltip: T.Delete,
            icon: Trash,
            selected: true,
            color: 'error',
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  dataCy: `modal-${VROUTER_ACTIONS.DELETE}`,
                  title: (rows) => {
                    const isMultiple = rows?.length > 1
                    const { ID, NAME } = rows?.[0]?.original ?? {}

                    return [
                      Tr(
                        isMultiple
                          ? T.DeleteSeveralVirtualRouters
                          : T.DeleteVirtualRouter
                      ),
                      !isMultiple && `#${ID} ${NAME}`,
                    ]
                      .filter(Boolean)
                      .join(' - ')
                  },
                },
                onSubmit: (rows) => async (formData) => {
                  const { image } = formData ?? {}
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => remove({ id, image })))
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
