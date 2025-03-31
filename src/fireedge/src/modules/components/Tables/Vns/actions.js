/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { Typography, useTheme } from '@mui/material'
import { Plus, Group, Lock, Trash } from 'iconoir-react'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import { useViews, ClusterAPI, VnAPI } from '@FeaturesModule'
import { isVnAvailableAction } from '@ModelsModule'

import { ChangeClusterForm } from '@modules/components/Forms/Cluster'
import { RecoverForm, ReserveForm } from '@modules/components/Forms/VNetwork'
import { ChangeGroupForm, ChangeUserForm } from '@modules/components/Forms/Vm'
import { Translate } from '@modules/components/HOC'
import {
  GlobalAction,
  createActions,
} from '@modules/components/Tables/Enhanced/Utils'
import VnTemplatesTable from '@modules/components/Tables/VnTemplates'

import { PATH } from '@modules/components/path'
import { RESOURCE_NAMES, T, VN_ACTIONS, STYLE_BUTTONS } from '@ConstantsModule'
import { css } from '@emotion/css'

const isDisabled = (action) => (rows) =>
  !isVnAvailableAction(
    action,
    rows.map(({ original }) => original)
  )

const useTableStyles = () => ({
  body: css({ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }),
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
  const [changeCluster] = ClusterAPI.useAddNetworkToClusterMutation()
  const [reserve] = VnAPI.useReserveAddressMutation()
  const [recover] = VnAPI.useRecoverVNetMutation()
  const [lock] = VnAPI.useLockVNetMutation()
  const [unlock] = VnAPI.useUnlockVNetMutation()
  const [changeOwnership] = VnAPI.useChangeVNetOwnershipMutation()
  const [remove] = VnAPI.useRemoveVNetMutation()

  const actions = useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.VNET)?.actions,
        actions: [
          {
            accessor: VN_ACTIONS.CREATE_DIALOG,
            dataCy: `vnet-${VN_ACTIONS.CREATE_DIALOG}`,
            tooltip: T.Create,
            label: T.Create,
            icon: Plus,
            importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.FILLED,
            action: () => history.push(PATH.NETWORK.VNETS.CREATE),
          },
          {
            accessor: VN_ACTIONS.INSTANTIATE_DIALOG,
            dataCy: `vnet-${VN_ACTIONS.INSTANTIATE_DIALOG}`,
            tooltip: T.CreateFromTemplate,
            label: T.CreateFromTemplate,
            icon: Plus,
            importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.FILLED,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Instantiate,
                  children: () => {
                    const theme = useTheme()
                    const classes = useMemo(() => useTableStyles(theme))
                    const path = PATH.NETWORK.VN_TEMPLATES.INSTANTIATE

                    return (
                      <VnTemplatesTable.Table
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
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            selected: { max: 1 },

            action: (rows) => {
              const vnet = rows?.[0]?.original ?? {}
              const path = PATH.NETWORK.VNETS.UPDATE

              history.push(path, vnet)
            },
          },
          {
            accessor: VN_ACTIONS.RESERVE_DIALOG,
            dataCy: `vnet-${VN_ACTIONS.RESERVE_DIALOG}`,
            label: T.Reserve,
            selected: { max: 1 },
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
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
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
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
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
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
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
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
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
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
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
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
            importance: STYLE_BUTTONS.IMPORTANCE.DANGER,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
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
