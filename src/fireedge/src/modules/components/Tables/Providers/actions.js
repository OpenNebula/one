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
import { Box, Typography } from '@mui/material'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { PATH } from '@modules/components/path'

import {
  PROVIDER_ACTIONS,
  RESOURCE_NAMES,
  STYLE_BUTTONS,
  T,
} from '@ConstantsModule'
import { ProviderAPI, useGeneralApi, useViews } from '@FeaturesModule'
import { Translate } from '@modules/components/HOC'
import { ChangeGroupForm, ChangeUserForm } from '@modules/components/Forms/Vm'
import {
  createActions,
  GlobalAction,
} from '@modules/components/Tables/Enhanced/Utils'
import { Group, Plus, Trash } from 'iconoir-react'

/**
 * List all the provider names.
 *
 * @param {object} param - Properties
 * @param {Array} param.rows - List of drivers
 * @returns {Array} - List of drivers
 */
const ListProviderNames = ({ rows = [] }) =>
  rows.map(({ id, original }) => {
    const { ID, NAME } = original

    return (
      <Typography
        key={`provider-${id}`}
        variant="inherit"
        component="span"
        display="block"
      >
        {`#${ID} ${NAME}`}
      </Typography>
    )
  })

const SubHeader = (rows) => <ListProviderNames rows={rows} />

const MessageToConfirmAction = (rows, description) => (
  <Box sx={{ minWidth: '25vw' }}>
    <ListProviderNames rows={rows} />
    {description && <Translate word={description} />}
    <Translate word={T.DoYouWantProceed} />
  </Box>
)

MessageToConfirmAction.displayName = 'MessageToConfirmAction'

/**
 * Generates the actions to operate resources on Host table.
 *
 * @param {object} props - datatable props
 * @param {Function} props.setSelectedRows - set selected rows
 * @returns {GlobalAction} - Actions
 */
const Actions = (props = {}) => {
  const { setSelectedRows } = props
  const history = useHistory()
  const { view, getResourceView } = useViews()
  const { setSecondTitle } = useGeneralApi()

  const [remove] = ProviderAPI.useRemoveProviderMutation()
  const [changeOwnership] = ProviderAPI.useChangeProviderOwnershipMutation()

  const providerActions = useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.PROVIDER)?.actions,
        actions: [
          {
            accessor: PROVIDER_ACTIONS.CREATE_DIALOG,
            tooltip: T.Create,
            label: T.Create,
            icon: Plus,
            importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.FILLED,
            action: () => {
              setSecondTitle({})
              history.push(PATH.INFRASTRUCTURE.PROVIDERS.CREATE)
            },
          },
          {
            accessor: PROVIDER_ACTIONS.UPDATE_DIALOG,
            label: T.Update,
            tooltip: T.Update,
            selected: { max: 1 },
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            action: (rows) => {
              const provider = rows?.[0]?.original ?? {}
              const path = PATH.INFRASTRUCTURE.PROVIDERS.CREATE

              history.push(path, provider)
            },
          },
          {
            tooltip: T.Ownership,
            icon: Group,
            selected: true,
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            dataCy: 'template-ownership',
            options: [
              {
                accessor: PROVIDER_ACTIONS.CHANGE_OWNER,
                name: T.ChangeOwner,
                dialogProps: {
                  title: T.ChangeOwner,
                  subheader: SubHeader,
                  dataCy: `modal-${PROVIDER_ACTIONS.CHANGE_OWNER}`,
                  validateOn: 'onSubmit',
                },
                form: ChangeUserForm,
                onSubmit: (rows) => (newOwnership) => {
                  rows?.map?.(({ original }) =>
                    changeOwnership({ id: original?.ID, ...newOwnership })
                  )
                },
              },
              {
                accessor: PROVIDER_ACTIONS.CHANGE_GROUP,
                name: T.ChangeGroup,
                dialogProps: {
                  title: T.ChangeGroup,
                  subheader: SubHeader,
                  dataCy: `modal-${PROVIDER_ACTIONS.CHANGE_GROUP}`,
                  validateOn: 'onSubmit',
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
            accessor: PROVIDER_ACTIONS.DELETE,
            tooltip: T.Delete,
            icon: Trash,
            selected: { min: 1 },
            importance: STYLE_BUTTONS.IMPORTANCE.DANGER,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Delete,
                  dataCy: `modal-${PROVIDER_ACTIONS.DELETE}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => remove({ id })))
                  setSelectedRows && setSelectedRows([])
                },
              },
            ],
          },
        ],
      }),
    [view]
  )

  return providerActions
}

export default Actions
