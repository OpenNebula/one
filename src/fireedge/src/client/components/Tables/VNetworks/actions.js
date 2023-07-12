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
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import {
  AddCircledOutline,
  // Import,
  Trash,
  PlayOutline,
  Lock,
  Group,
} from 'iconoir-react'
import { Typography } from '@mui/material'
import { makeStyles } from '@mui/styles'

import { useViews } from 'client/features/Auth'
import { useAddNetworkToClusterMutation } from 'client/features/OneApi/cluster'
import {
  useReserveAddressMutation,
  useLockVNetMutation,
  useUnlockVNetMutation,
  useChangeVNetOwnershipMutation,
  useRemoveVNetMutation,
  useRecoverVNetMutation,
} from 'client/features/OneApi/network'
import { isAvailableAction } from 'client/models/VirtualNetwork'

import { ChangeUserForm, ChangeGroupForm } from 'client/components/Forms/Vm'
import { ReserveForm, RecoverForm } from 'client/components/Forms/VNetwork'
import { ChangeClusterForm } from 'client/components/Forms/Cluster'
import {
  createActions,
  GlobalAction,
} from 'client/components/Tables/Enhanced/Utils'
import VNetworkTemplatesTable from 'client/components/Tables/VNetworkTemplates'
import { Translate } from 'client/components/HOC'

import { PATH } from 'client/apps/sunstone/routesOne'
import { T, VN_ACTIONS, RESOURCE_NAMES } from 'client/constants'

const isDisabled = (action) => (rows) =>
  !isAvailableAction(
    action,
    rows.map(({ original }) => original)
  )

const useTableStyles = makeStyles({
  body: { gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' },
})

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
  const [reserve] = useReserveAddressMutation()
  const [recover] = useRecoverVNetMutation()
  const [changeCluster] = useAddNetworkToClusterMutation()
  const [lock] = useLockVNetMutation()
  const [unlock] = useUnlockVNetMutation()
  const [changeOwnership] = useChangeVNetOwnershipMutation()
  const [remove] = useRemoveVNetMutation()

  const actions = useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.VNET)?.actions,
        actions: [
          {
            accessor: VN_ACTIONS.CREATE_DIALOG,
            dataCy: `vnet-${VN_ACTIONS.CREATE_DIALOG}`,
            tooltip: T.Create,
            icon: AddCircledOutline,
            action: () => history.push(PATH.NETWORK.VNETS.CREATE),
          },
          /* {
            // TODO: Import Virtual Network from vCenter
            accessor: VN_ACTIONS.IMPORT_DIALOG,
            tooltip: T.Import,
            icon: Import,
            selected: { max: 1 },
            disabled: true,
            action: (rows) => {
              // TODO: go to IMPORT form
            },
          }, */
          {
            accessor: VN_ACTIONS.INSTANTIATE_DIALOG,
            dataCy: `vnet-${VN_ACTIONS.INSTANTIATE_DIALOG}`,
            tooltip: T.Instantiate,
            selected: true,
            icon: PlayOutline,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Instantiate,
                  children: () => {
                    const classes = useTableStyles()
                    const path = PATH.NETWORK.VN_TEMPLATES.INSTANTIATE

                    return (
                      <VNetworkTemplatesTable
                        disableGlobalSort
                        disableRowSelect
                        classes={classes}
                        onRowClick={(vnet) => history.push(path, vnet)}
                      />
                    )
                  },
                  fixedWidth: true,
                  fixedHeight: true,
                  handleAccept: undefined,
                  dataCy: `modal-${VN_ACTIONS.CREATE_DIALOG}`,
                },
              },
            ],
          },
          {
            accessor: VN_ACTIONS.UPDATE_DIALOG,
            dataCy: `vnet-${VN_ACTIONS.UPDATE_DIALOG}`,
            label: T.Update,
            tooltip: T.Update,
            selected: { max: 1 },
            color: 'secondary',
            action: (rows) => {
              const vnet = rows?.[0]?.original ?? {}
              const path = PATH.NETWORK.VNETS.CREATE

              history.push(path, vnet)
            },
          },
          {
            accessor: VN_ACTIONS.RESERVE_DIALOG,
            dataCy: `vnet-${VN_ACTIONS.RESERVE_DIALOG}`,
            label: T.Reserve,
            selected: { max: 1 },
            color: 'secondary',
            options: [
              {
                dialogProps: {
                  title: T.ReservationFromVirtualNetwork,
                  dataCy: 'modal-reserve',
                },
                form: (rows) => {
                  const vnet = rows?.[0]?.original || {}

                  return ReserveForm({ stepProps: { vnet } })
                },
                onSubmit: (rows) => async (template) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => reserve({ id, template })))
                },
              },
            ],
          },
          {
            accessor: VN_ACTIONS.RECOVER,
            disabled: isDisabled(VN_ACTIONS.RECOVER),
            dataCy: `vnet-${VN_ACTIONS.RECOVER}`,
            label: T.Recover,
            selected: { max: 1 },
            color: 'secondary',
            options: [
              {
                dialogProps: {
                  title: T.Recover,
                  dataCy: `modal-${VN_ACTIONS.RECOVER}`,
                },
                form: RecoverForm,
                onSubmit: (rows) => async (formData) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => recover({ id, ...formData }))
                  )
                },
              },
            ],
          },
          {
            label: T.Reserve,
            selected: { max: 1 },
            color: 'secondary',
            options: [
              {
                dialogProps: {
                  title: T.ReservationFromVirtualNetwork,
                  dataCy: 'modal-reserve',
                },
                form: (rows) => {
                  const vnet = rows?.[0]?.original || {}

                  return ReserveForm({ stepProps: { vnet } })
                },
                onSubmit: (rows) => async (template) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => reserve({ id, template })))
                },
              },
            ],
          },
          {
            accessor: VN_ACTIONS.CHANGE_CLUSTER,
            color: 'secondary',
            dataCy: `vnet-${VN_ACTIONS.CHANGE_CLUSTER}`,
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
            dataCy: 'vnet-ownership',
            options: [
              {
                accessor: VN_ACTIONS.CHANGE_OWNER,
                name: T.ChangeOwner,
                dialogProps: {
                  title: T.ChangeOwner,
                  subheader: SubHeader,
                  dataCy: `modal-${VN_ACTIONS.CHANGE_OWNER}`,
                },
                form: ChangeUserForm,
                onSubmit: (rows) => (newOwnership) => {
                  rows?.map?.(({ original }) =>
                    changeOwnership({ id: original?.ID, ...newOwnership })
                  )
                },
              },
              {
                accessor: VN_ACTIONS.CHANGE_GROUP,
                name: T.ChangeGroup,
                dialogProps: {
                  title: T.ChangeGroup,
                  subheader: SubHeader,
                  dataCy: `modal-${VN_ACTIONS.CHANGE_GROUP}`,
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
            dataCy: 'vnet-lock',
            options: [
              {
                accessor: VN_ACTIONS.LOCK,
                name: T.Lock,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Lock,
                  dataCy: `modal-${VN_ACTIONS.LOCK}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => lock({ id })))
                },
              },
              {
                accessor: VN_ACTIONS.UNLOCK,
                name: T.Unlock,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Unlock,
                  dataCy: `modal-${VN_ACTIONS.UNLOCK}`,
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
            accessor: VN_ACTIONS.DELETE,
            dataCy: `vnet-${VN_ACTIONS.DELETE}`,
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
                  dataCy: `modal-vnet-${VN_ACTIONS.DELETE}`,
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
