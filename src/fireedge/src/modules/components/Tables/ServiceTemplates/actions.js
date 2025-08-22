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
import { Group, Play, Plus, Trash } from 'iconoir-react'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import { ServiceTemplateAPI, useViews } from '@FeaturesModule'

import { ChangeGroupForm, ChangeUserForm } from '@modules/components/Forms/Vm'
import {
  createActions,
  GlobalAction,
} from '@modules/components/Tables/Enhanced/Utils'

import {
  RESOURCE_NAMES,
  SERVICE_TEMPLATE_ACTIONS,
  STYLE_BUTTONS,
  T,
} from '@ConstantsModule'
import { Translate } from '@modules/components/HOC'
import { PATH } from '@modules/components/path'

const ListServiceTemplateNames = ({ rows = [] }) =>
  rows?.map?.(({ id, original }) => {
    const { ID, NAME } = original

    return (
      <Typography
        key={`service-template-${id}`}
        variant="inherit"
        component="span"
        display="block"
      >
        {`#${ID} ${NAME}`}
      </Typography>
    )
  })

const SubHeader = (rows) => <ListServiceTemplateNames rows={rows} />

const MessageToConfirmAction = (rows, description) => (
  <Box sx={{ minWidth: '25vw' }}>
    <ListServiceTemplateNames rows={rows} />
    {description && <Translate word={description} />}
    <Translate word={T.DoYouWantProceed} />
  </Box>
)

MessageToConfirmAction.displayName = 'MessageToConfirmAction'

/**
 * Generates the actions to operate resources on VM Template table.
 *
 * @param {object} props - datatable props
 * @param {Function} props.setSelectedRows - set selected rows
 * @returns {GlobalAction} - Actions
 */
const Actions = (props = {}) => {
  const { setSelectedRows } = props
  const history = useHistory()
  const { view, getResourceView } = useViews()

  // const [clone] = useCloneTemplateMutation()
  const [remove] = ServiceTemplateAPI.useRemoveServiceTemplateMutation()
  const [changeOwnership] =
    ServiceTemplateAPI.useChangeServiceTemplateOwnershipMutation()

  return useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.SERVICE_TEMPLATE)?.actions,
        actions: [
          {
            accessor: SERVICE_TEMPLATE_ACTIONS.CREATE_DIALOG,
            tooltip: T.Create,
            label: T.Create,
            icon: Plus,
            importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.FILLED,
            action: () => history.push(PATH.TEMPLATE.SERVICES.CREATE),
          },
          {
            accessor: SERVICE_TEMPLATE_ACTIONS.INSTANTIATE_DIALOG,
            tooltip: T.Instantiate,
            icon: Play,
            selected: { max: 1 },
            importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.FILLED,
            action: (rows) => {
              const template = rows?.[0]?.original ?? {}
              const path = PATH.TEMPLATE.SERVICES.INSTANTIATE

              history.push(path, template)
            },
          },
          {
            accessor: SERVICE_TEMPLATE_ACTIONS.UPDATE_DIALOG,
            label: T.Update,
            tooltip: T.Update,
            selected: { max: 1 },
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            action: (rows) => {
              const serviceTemplate = rows?.[0]?.original ?? {}
              const path = PATH.TEMPLATE.SERVICES.CREATE

              history.push(path, serviceTemplate)
            },
          },
          // {
          //   accessor: SERVICE_TEMPLATE_ACTIONS.CLONE,
          //   label: T.Clone,
          //   tooltip: T.Clone,
          //   selected: true,
          //
          //   options: [
          //     {
          //       dialogProps: {
          //         title: (rows) => {
          //           const isMultiple = rows?.length > 1
          //           const { ID, NAME } = rows?.[0]?.original ?? {}

          //           return [
          //             Tr(
          //               isMultiple ? T.CloneSeveralTemplates : T.CloneTemplate
          //             ),
          //             !isMultiple && `#${ID} ${NAME}`,
          //           ]
          //             .filter(Boolean)
          //             .join(' - ')
          //         },
          //         dataCy: 'modal-clone',
          //       },
          // form: (rows) => {
          //   const names = rows?.map(({ original }) => original?.NAME)
          //   const stepProps = { isMultiple: names.length > 1 }
          //   const initialValues = { name: `Copy of ${names?.[0]}` }

          //   return CloneForm({ stepProps, initialValues })
          // },
          // onSubmit:
          //   (rows) =>
          //   async ({ prefix, name, image } = {}) => {
          //     const serviceTemplates = rows?.map?.(
          //       ({ original: { ID, NAME } = {} }) =>
          //         // overwrite all names with prefix+NAME
          //         ({
          //           id: ID,
          //           name: prefix ? `${prefix} ${NAME}` : name,
          //           image,
          //         })
          //     )

          //     await Promise.all(serviceTemplates.map(clone))
          //   },
          // },
          // ],
          // },
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
                accessor: SERVICE_TEMPLATE_ACTIONS.CHANGE_OWNER,
                name: T.ChangeOwner,
                dialogProps: {
                  title: T.ChangeOwner,
                  subheader: SubHeader,
                  dataCy: `modal-${SERVICE_TEMPLATE_ACTIONS.CHANGE_OWNER}`,
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
                accessor: SERVICE_TEMPLATE_ACTIONS.CHANGE_GROUP,
                name: T.ChangeGroup,
                dialogProps: {
                  title: T.ChangeGroup,
                  subheader: SubHeader,
                  dataCy: `modal-${SERVICE_TEMPLATE_ACTIONS.CHANGE_GROUP}`,
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
            accessor: SERVICE_TEMPLATE_ACTIONS.DELETE,
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
                  dataCy: `modal-${SERVICE_TEMPLATE_ACTIONS.DELETE}`,
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
}

export default Actions
