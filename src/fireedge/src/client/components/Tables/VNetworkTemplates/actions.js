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
import {
  AddCircledOutline,
  Group,
  Lock,
  PlayOutline,
  // Import,
  Trash,
} from 'iconoir-react'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import { useViews } from 'client/features/Auth'
import { useAddNetworkToClusterMutation } from 'client/features/OneApi/cluster'
import {
  useChangeVNTemplateOwnershipMutation,
  useLockVNTemplateMutation,
  // useRecoverVNetMutation,
  useRemoveVNTemplateMutation,
  // useReserveAddressMutation,
  useUnlockVNTemplateMutation,
} from 'client/features/OneApi/networkTemplate'

import { ChangeClusterForm } from 'client/components/Forms/Cluster'
import { ChangeGroupForm, ChangeUserForm } from 'client/components/Forms/Vm'
import { Translate } from 'client/components/HOC'
import {
  GlobalAction,
  createActions,
} from 'client/components/Tables/Enhanced/Utils'

import { PATH } from 'client/apps/sunstone/routesOne'
import { RESOURCE_NAMES, T, VN_TEMPLATE_ACTIONS } from 'client/constants'

const ListNames = ({ rows = [] }) =>
  rows?.map?.(({ id, original }) => {
    const { ID, NAME } = original

    return (
      <Typography
        key={`vnet-${id}`}
        variant="inherit"
        component="span"
        display="block"
      >
        {`#${ID} ${NAME}`}
      </Typography>
    )
  })

const SubHeader = (rows) => <ListNames rows={rows} />

const MessageToConfirmAction = (rows) => {
  const names = rows?.map?.(({ original }) => original?.NAME)

  return (
    <>
      <p>
        <Translate word={T.VirtualNetworks} />
        {`: ${names.join(', ')}`}
      </p>
      <p>
        <Translate word={T.DoYouWantProceed} />
      </p>
    </>
  )
}

MessageToConfirmAction.displayName = 'MessageToConfirmAction'

/**
 * Generates the actions to operate resources on Virtual networks table.
 *
 * @returns {GlobalAction} - Actions
 */
const Actions = () => {
  const history = useHistory()
  const { view, getResourceView } = useViews()
  // const [reserve] = useReserveAddressMutation()
  // const [recover] = useRecoverVNetMutation()
  const [changeCluster] = useAddNetworkToClusterMutation()
  const [lock] = useLockVNTemplateMutation()
  const [unlock] = useUnlockVNTemplateMutation()
  const [changeOwnership] = useChangeVNTemplateOwnershipMutation()
  const [remove] = useRemoveVNTemplateMutation()

  const actions = useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.VN_TEMPLATE)?.actions,
        actions: [
          {
            accessor: VN_TEMPLATE_ACTIONS.CREATE_DIALOG,
            dataCy: `vnettemplate-${VN_TEMPLATE_ACTIONS.CREATE_DIALOG}`,
            tooltip: T.Create,
            icon: AddCircledOutline,
            action: () => history.push(PATH.NETWORK.VN_TEMPLATES.CREATE),
          },
          {
            accessor: VN_TEMPLATE_ACTIONS.INSTANTIATE_DIALOG,
            dataCy: `vnettemplate-${VN_TEMPLATE_ACTIONS.INSTANTIATE_DIALOG}`,
            tooltip: T.Instantiate,
            icon: PlayOutline,
            selected: { max: 1 },
            action: (rows) => {
              const template = rows?.[0]?.original ?? {}
              const path = PATH.NETWORK.VN_TEMPLATES.INSTANTIATE

              history.push(path, template)
            },
          },
          {
            accessor: VN_TEMPLATE_ACTIONS.UPDATE_DIALOG,
            dataCy: `vnettemplate-${VN_TEMPLATE_ACTIONS.UPDATE_DIALOG}`,
            label: T.Update,
            tooltip: T.Update,
            selected: { max: 1 },
            color: 'secondary',
            action: (rows) => {
              const vnet = rows?.[0]?.original ?? {}
              const path = PATH.NETWORK.VN_TEMPLATES.CREATE

              history.push(path, vnet)
            },
          },
          {
            accessor: VN_TEMPLATE_ACTIONS.CHANGE_CLUSTER,
            color: 'secondary',
            dataCy: `vnettemplate-${VN_TEMPLATE_ACTIONS.CHANGE_CLUSTER}`,
            label: T.SelectCluster,
            tooltip: T.SelectCluster,
            selected: true,
            options: [
              {
                dialogProps: {
                  title: T.SelectCluster,
                  dataCy: 'modal-select-cluster',
                },
                form: () => ChangeClusterForm(),
                onSubmit: (rows) => async (formData) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)

                  await Promise.all(
                    ids.map((id) =>
                      changeCluster({ id: formData.cluster, vnet: id })
                    )
                  )
                },
              },
            ],
          },
          {
            tooltip: T.Ownership,
            icon: Group,
            selected: true,
            color: 'secondary',
            dataCy: 'vnettemplate-ownership',
            options: [
              {
                accessor: VN_TEMPLATE_ACTIONS.CHANGE_OWNER,
                name: T.ChangeOwner,
                dialogProps: {
                  title: T.ChangeOwner,
                  subheader: SubHeader,
                  dataCy: `modal-${VN_TEMPLATE_ACTIONS.CHANGE_OWNER}`,
                },
                form: ChangeUserForm,
                onSubmit: (rows) => (newOwnership) => {
                  rows?.map?.(({ original }) =>
                    changeOwnership({ id: original?.ID, ...newOwnership })
                  )
                },
              },
              {
                accessor: VN_TEMPLATE_ACTIONS.CHANGE_GROUP,
                name: T.ChangeGroup,
                dialogProps: {
                  title: T.ChangeGroup,
                  subheader: SubHeader,
                  dataCy: `modal-${VN_TEMPLATE_ACTIONS.CHANGE_GROUP}`,
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
            dataCy: 'vnettemplate-lock',
            options: [
              {
                accessor: VN_TEMPLATE_ACTIONS.LOCK,
                name: T.Lock,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Lock,
                  dataCy: `modal-${VN_TEMPLATE_ACTIONS.LOCK}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => lock({ id })))
                },
              },
              {
                accessor: VN_TEMPLATE_ACTIONS.UNLOCK,
                name: T.Unlock,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Unlock,
                  dataCy: `modal-${VN_TEMPLATE_ACTIONS.UNLOCK}`,
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
            accessor: VN_TEMPLATE_ACTIONS.DELETE,
            dataCy: `vnettemplate-${VN_TEMPLATE_ACTIONS.DELETE}`,
            tooltip: T.Delete,
            icon: Trash,
            selected: true,
            color: 'error',
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Delete,
                  children: MessageToConfirmAction,
                  dataCy: `modal-vnettemplate-${VN_TEMPLATE_ACTIONS.DELETE}`,
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

  return actions
}

export default Actions
