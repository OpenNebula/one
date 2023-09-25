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
  CloudDownload,
  DownloadCircledOutline,
  Lock,
  MoreVert,
  Group,
  Trash,
} from 'iconoir-react'
import PropTypes from 'prop-types'

import { useViews } from 'client/features/Auth'
import { useGeneralApi } from 'client/features/General'
import { Translate } from 'client/components/HOC'
import {
  useExportAppMutation,
  useDownloadAppMutation,
  useLockAppMutation,
  useUnlockAppMutation,
  useEnableAppMutation,
  useDisableAppMutation,
  useChangeAppOwnershipMutation,
  useDeleteAppMutation,
} from 'client/features/OneApi/marketplaceApp'

import { ExportForm } from 'client/components/Forms/MarketplaceApp'
import {
  createActions,
  GlobalAction,
} from 'client/components/Tables/Enhanced/Utils'

import { PATH } from 'client/apps/sunstone/routesOne'
import { T, RESOURCE_NAMES, MARKETPLACE_APP_ACTIONS } from 'client/constants'
import { ChangeGroupForm, ChangeUserForm } from 'client/components/Forms/Vm'
import { Typography } from '@mui/material'

const ListAppNames = ({ rows = [] }) => {
  const names = rows?.map?.(({ original }) => original?.NAME)

  return (
    <Typography variant="inherit" component="span" display="block">
      <Translate word={T.Apps} />
      {`: ${names.join(', ')}`}
    </Typography>
  )
}
ListAppNames.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      original: PropTypes.shape({
        NAME: PropTypes.string,
      }),
    })
  ),
}

const SubHeader = (rows) => <ListAppNames rows={rows} />

const MessageToConfirmAction = (rows) => (
  <>
    <ListAppNames rows={rows} />
    <Translate word={T.DoYouWantProceed} />
  </>
)

MessageToConfirmAction.displayName = 'MessageToConfirmAction'

/**
 * Generates the actions to operate resources on Host table.
 *
 * @returns {GlobalAction} - Actions
 */
const Actions = () => {
  const history = useHistory()
  const { view, getResourceView } = useViews()
  const { enqueueSuccess } = useGeneralApi()
  const [exportApp] = useExportAppMutation()
  const [downloadApp] = useDownloadAppMutation()
  const [lock] = useLockAppMutation()
  const [unlock] = useUnlockAppMutation()
  const [enable] = useEnableAppMutation()
  const [disable] = useDisableAppMutation()
  const [changeOwnership] = useChangeAppOwnershipMutation()
  const [deleteApp] = useDeleteAppMutation()

  const marketplaceAppActions = useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.APP)?.actions,
        actions: [
          {
            accessor: MARKETPLACE_APP_ACTIONS.CREATE_DIALOG,
            tooltip: T.CreateMarketApp,
            icon: AddCircledOutline,
            action: () => {
              history.push(PATH.STORAGE.MARKETPLACE_APPS.CREATE)
            },
          },
          {
            accessor: MARKETPLACE_APP_ACTIONS.EXPORT,
            tooltip: T.ImportIntoDatastore,
            selected: { max: 1 },
            icon: CloudDownload,
            options: [
              {
                dialogProps: {
                  title: T.DownloadAppToOpenNebula,
                  dataCy: 'modal-export',
                },
                form: (rows) => {
                  const app = rows?.map(({ original }) => original)[0]

                  return ExportForm({ initialValues: app, stepProps: app })
                },
                onSubmit: (rows) => async (formData) => {
                  const id = rows?.[0]?.original?.ID
                  const res = await exportApp({ id, ...formData }).unwrap()
                  enqueueSuccess(res)
                },
              },
            ],
          },
          {
            accessor: MARKETPLACE_APP_ACTIONS.DOWNLOAD,
            tooltip: T.DownloadApp,
            selected: { min: 1 },
            icon: DownloadCircledOutline,
            action: async (apps) => {
              const urls = await Promise.all(
                apps.map(({ id }) => downloadApp(id).unwrap())
              )
              urls.forEach((url) => window.open(url, '_blank'))
            },
          },
          {
            tooltip: T.Lock,
            icon: Lock,
            selected: true,
            color: 'secondary',
            dataCy: 'marketapp-lock',
            options: [
              {
                accessor: MARKETPLACE_APP_ACTIONS.LOCK,
                name: T.Lock,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Lock,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${MARKETPLACE_APP_ACTIONS.LOCK}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => lock({ id })))
                },
              },
              {
                accessor: MARKETPLACE_APP_ACTIONS.UNLOCK,
                name: T.Unlock,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Unlock,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${MARKETPLACE_APP_ACTIONS.UNLOCK}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => unlock({ id })))
                },
              },
            ],
          },
          {
            tooltip: T.Enable,
            icon: MoreVert,
            selected: true,
            color: 'secondary',
            dataCy: 'marketapp-enable',
            options: [
              {
                accessor: MARKETPLACE_APP_ACTIONS.ENABLE,
                name: T.Enable,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Enable,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${MARKETPLACE_APP_ACTIONS.ENABLE}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => enable(id)))
                },
              },
              {
                accessor: MARKETPLACE_APP_ACTIONS.DISABLE,
                name: T.Disable,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Disable,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${MARKETPLACE_APP_ACTIONS.DISABLE}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => disable(id)))
                },
              },
            ],
          },
          {
            tooltip: T.Ownership,
            icon: Group,
            selected: true,
            color: 'secondary',
            dataCy: 'marketapp-ownership',
            disabled: (rows) =>
              rows.some(({ original }) => original?.MARKETPLACE_ID === '0'),
            options: [
              {
                accessor: MARKETPLACE_APP_ACTIONS.CHANGE_OWNER,
                name: T.ChangeOwner,
                dialogProps: {
                  title: T.ChangeOwner,
                  subheader: SubHeader,
                  dataCy: `modal-${MARKETPLACE_APP_ACTIONS.CHANGE_OWNER}`,
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
                accessor: MARKETPLACE_APP_ACTIONS.CHANGE_GROUP,
                name: T.ChangeGroup,
                dialogProps: {
                  title: T.ChangeGroup,
                  subheader: SubHeader,
                  dataCy: `modal-${MARKETPLACE_APP_ACTIONS.CHANGE_GROUP}`,
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
            accessor: MARKETPLACE_APP_ACTIONS.DELETE,
            tooltip: T.Delete,
            icon: Trash,
            color: 'error',
            selected: { min: 1 },
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Delete,
                  dataCy: `modal-${MARKETPLACE_APP_ACTIONS.DELETE}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => deleteApp({ id })))
                },
              },
            ],
          },
        ],
      }),
    [view]
  )

  return marketplaceAppActions
}

export default Actions
