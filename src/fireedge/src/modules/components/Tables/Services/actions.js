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
import { useMemo } from 'react'
import { useTheme, Box, Typography } from '@mui/material'
import { css } from '@emotion/css'
import { useHistory } from 'react-router-dom'
import { PlayOutline, Trash, Group, RefreshCircular } from 'iconoir-react'

import { useViews, ServiceAPI } from '@FeaturesModule'

import { ChangeUserForm, ChangeGroupForm } from '@modules/components/Forms/Vm'
import {
  createActions,
  GlobalAction,
} from '@modules/components/Tables/Enhanced/Utils'

import ServiceTemplatesTable from '@modules/components/Tables/ServiceTemplates'
import { Translate } from '@modules/components/HOC'
import { PATH } from '@modules/components/path'
import { T, SERVICE_TEMPLATE_ACTIONS, RESOURCE_NAMES } from '@ConstantsModule'

const useTableStyles = () => ({
  body: css({ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }),
})

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
  <Box sx={{ minWidth: '25vw' }}>
    <ListVmTemplateNames rows={rows} />
    {description && <Translate word={description} />}
    <Translate word={T.DoYouWantProceed} />
  </Box>
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

  const [remove] = ServiceAPI.useRemoveServiceMutation()
  const [recover] = ServiceAPI.useRecoverServiceMutation()
  const [changeOwnership] = ServiceAPI.useChangeServiceOwnerMutation()

  return useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.SERVICE_TEMPLATE)?.actions,
        actions: [
          {
            accessor: SERVICE_TEMPLATE_ACTIONS.INSTANTIATE_DIALOG,
            tooltip: T.Instantiate,
            icon: PlayOutline,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Instantiate,
                  children: () => {
                    const theme = useTheme()
                    const classes = useMemo(
                      () => useTableStyles(theme),
                      [theme]
                    )

                    const redirectToInstantiate = (template) =>
                      history.push(PATH.INSTANCE.SERVICES.INSTANTIATE, template)

                    return (
                      <ServiceTemplatesTable.Table
                        disableGlobalSort
                        disableRowSelect
                        classes={classes}
                        onRowClick={redirectToInstantiate}
                      />
                    )
                  },
                  fixedWidth: true,
                  fixedHeight: true,
                  handleAccept: undefined,
                },
              },
            ],
          },
          {
            tooltip: T.Ownership,
            icon: Group,
            selected: { min: 1 },
            color: 'secondary',
            dataCy: 'template-ownership',
            options: [
              {
                accessor: SERVICE_TEMPLATE_ACTIONS.CHANGE_OWNER,
                name: T.ChangeOwner,
                dialogProps: {
                  title: T.ChangeOwner,
                  subheader: SubHeader,
                  dataCy: `modal-${SERVICE_TEMPLATE_ACTIONS.CHANGE_OWNER}`,
                },
                form: ChangeUserForm,
                onSubmit: (rows) => (newOwnership) => {
                  rows?.map?.(({ original }) =>
                    changeOwnership({ id: original?.ID, ...newOwnership })
                  )
                },
              },
              {
                accessor: SERVICE_TEMPLATE_ACTIONS.CHANGE_GROUP,
                name: T.ChangeGroup,
                dialogProps: {
                  title: T.ChangeGroup,
                  subheader: SubHeader,
                  dataCy: `modal-${SERVICE_TEMPLATE_ACTIONS.CHANGE_GROUP}`,
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
            tooltip: T.Recover,
            icon: RefreshCircular,
            selected: true,
            color: 'secondary',
            dataCy: 'service-recover',
            options: [
              {
                accessor: SERVICE_TEMPLATE_ACTIONS.RECOVER,
                name: T.RecoverService,
                isConfirmDialog: true,
                dialogProps: {
                  dataCy: `modal-${SERVICE_TEMPLATE_ACTIONS.RECOVER}`,
                  title: T.RecoverService,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => recover({ id })))
                },
              },
              {
                accessor: SERVICE_TEMPLATE_ACTIONS.RECOVER,
                name: `${T.Recover} ${T.Delete.toLowerCase()}`,
                isConfirmDialog: true,
                dialogProps: {
                  dataCy: `modal-${SERVICE_TEMPLATE_ACTIONS.RECOVER}`,
                  title: T.RecoverDelete,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => recover({ id, delete: true }))
                  )
                },
              },
            ],
          },
          {
            accessor: SERVICE_TEMPLATE_ACTIONS.DELETE,
            tooltip: T.Delete,
            icon: Trash,
            selected: true,
            color: 'error',
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  dataCy: `modal-${SERVICE_TEMPLATE_ACTIONS.DELETE}`,
                  title: T.Delete,
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
