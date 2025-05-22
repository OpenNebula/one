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
import { Typography } from '@mui/material'
import { Group, MoreVert, Plus, Trash } from 'iconoir-react'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import { ImageAPI, useViews } from '@FeaturesModule'

import { ChangeGroupForm, ChangeUserForm } from '@modules/components/Forms/Vm'
import {
  createActions,
  GlobalAction,
} from '@modules/components/Tables/Enhanced/Utils'

import {
  IMAGE_ACTIONS,
  RESOURCE_NAMES,
  STYLE_BUTTONS,
  T,
} from '@ConstantsModule'
import { isVmAvailableAction } from '@ModelsModule'
import { PATH } from '@modules/components'
import { Translate } from '@modules/components/HOC'

const isDisabled = (action) => (rows) =>
  !isVmAvailableAction(
    action,
    rows.map(({ original }) => original)
  )

const ListFilesNames = ({ rows = [] }) =>
  rows?.map?.(({ id, original }) => {
    const { ID, NAME } = original

    return (
      <Typography
        key={`file-${id}`}
        variant="inherit"
        component="span"
        display="block"
      >
        {`#${ID} ${NAME}`}
      </Typography>
    )
  })

const SubHeader = (rows) => <ListFilesNames rows={rows} />

const MessageToConfirmAction = (rows) => (
  <>
    <ListFilesNames rows={rows} />
    <Translate word={T.DoYouWantProceed} />
  </>
)

/**
 * Generates the actions to operate resources on Image table.
 *
 * @param {object} props - datatable props
 * @param {Function} props.setSelectedRows - set selected rows
 * @returns {GlobalAction} - Actions
 */
const Actions = (props = {}) => {
  const { setSelectedRows } = props
  const history = useHistory()
  const { view, getResourceView } = useViews()
  const [enable] = ImageAPI.useEnableImageMutation()
  const [disable] = ImageAPI.useDisableImageMutation()
  const [changeOwnership] = ImageAPI.useChangeImageOwnershipMutation()
  const [deleteImage] = ImageAPI.useRemoveImageMutation()

  const resourcesView = getResourceView(RESOURCE_NAMES.FILE)?.actions

  const fileActions = useMemo(
    () =>
      createActions({
        filters: resourcesView,
        actions: [
          {
            accessor: IMAGE_ACTIONS.CREATE_DIALOG,
            dataCy: `file_${IMAGE_ACTIONS.CREATE_DIALOG}`,
            disabled: isDisabled(IMAGE_ACTIONS.CREATE_DIALOG),
            tooltip: T.Create,
            label: T.Create,
            icon: Plus,
            importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.FILLED,
            action: (rows) => {
              history.push(PATH.STORAGE.FILES.CREATE)
            },
          },
          {
            tooltip: T.Enable,
            icon: MoreVert,
            selected: true,
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            dataCy: 'image-enable',
            options: [
              {
                accessor: IMAGE_ACTIONS.ENABLE,
                name: T.Enable,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Enable,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${IMAGE_ACTIONS.ENABLE}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => enable(id)))
                },
              },
              {
                accessor: IMAGE_ACTIONS.DISABLE,
                name: T.Disable,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Disable,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${IMAGE_ACTIONS.DISABLE}`,
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
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            dataCy: 'image-ownership',
            options: [
              {
                accessor: IMAGE_ACTIONS.CHANGE_OWNER,
                disabled: isDisabled(IMAGE_ACTIONS.CHANGE_OWNER),
                name: T.ChangeOwner,
                dialogProps: {
                  title: T.ChangeOwner,
                  subheader: SubHeader,
                  dataCy: `modal-${IMAGE_ACTIONS.CHANGE_OWNER}`,
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
                accessor: IMAGE_ACTIONS.CHANGE_GROUP,
                disabled: isDisabled(IMAGE_ACTIONS.CHANGE_GROUP),
                name: T.ChangeGroup,
                dialogProps: {
                  title: T.ChangeGroup,
                  subheader: SubHeader,
                  dataCy: `modal-${IMAGE_ACTIONS.CHANGE_GROUP}`,
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
            accessor: IMAGE_ACTIONS.DELETE,
            tooltip: T.Delete,
            icon: Trash,
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            selected: { min: 1 },
            dataCy: `image_${IMAGE_ACTIONS.DELETE}`,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Delete,
                  dataCy: `modal-${IMAGE_ACTIONS.DELETE}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => deleteImage({ id })))
                  setSelectedRows && setSelectedRows([])
                },
              },
            ],
          },
        ],
      }),
    [view]
  )

  return fileActions
}

export default Actions
