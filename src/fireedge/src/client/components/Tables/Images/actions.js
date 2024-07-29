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
  Cart,
  Group,
  Lock,
  MoreVert,
  Trash,
} from 'iconoir-react'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import { useViews } from 'client/features/Auth'
import {
  useChangeImageOwnershipMutation,
  useCloneImageMutation,
  useDisableImageMutation,
  useEnableImageMutation,
  useLockImageMutation,
  usePersistentImageMutation,
  useRemoveImageMutation,
  useUnlockImageMutation,
} from 'client/features/OneApi/image'

import { CloneForm } from 'client/components/Forms/Image'
import { ChangeGroupForm, ChangeUserForm } from 'client/components/Forms/Vm'
import {
  GlobalAction,
  createActions,
} from 'client/components/Tables/Enhanced/Utils'

import { PATH } from 'client/apps/sunstone/routesOne'
import { Tr, Translate } from 'client/components/HOC'
import { IMAGE_ACTIONS, RESOURCE_NAMES, T, VM_ACTIONS } from 'client/constants'
import { isAvailableAction } from 'client/models/VirtualMachine'

const isDisabled = (action) => (rows) =>
  !isAvailableAction(
    action,
    rows.map(({ original }) => original)
  )

const ListImagesNames = ({ rows = [] }) =>
  rows?.map?.(({ id, original }) => {
    const { ID, NAME } = original

    return (
      <Typography
        key={`image-${id}`}
        variant="inherit"
        component="span"
        display="block"
      >
        {`#${ID} ${NAME}`}
      </Typography>
    )
  })

const SubHeader = (rows) => <ListImagesNames rows={rows} />

const MessageToConfirmAction = (rows) => (
  <>
    <ListImagesNames rows={rows} />
    <Translate word={T.DoYouWantProceed} />
  </>
)

/**
 * Generates the actions to operate resources on Image table.
 *
 * @returns {GlobalAction} - Actions
 */
const Actions = () => {
  const history = useHistory()
  const { view, getResourceView } = useViews()
  const [clone] = useCloneImageMutation()
  const [lock] = useLockImageMutation()
  const [unlock] = useUnlockImageMutation()
  const [enable] = useEnableImageMutation()
  const [disable] = useDisableImageMutation()
  const [persistent] = usePersistentImageMutation()
  const [changeOwnership] = useChangeImageOwnershipMutation()
  const [deleteImage] = useRemoveImageMutation()

  const resourcesView = getResourceView(RESOURCE_NAMES.IMAGE)?.actions

  const imageActions = useMemo(
    () =>
      createActions({
        filters: resourcesView,
        actions: [
          {
            accessor: IMAGE_ACTIONS.CREATE_DIALOG,
            tooltip: T.CreateImage,
            dataCy: `image_${IMAGE_ACTIONS.CREATE_DIALOG}`,
            icon: AddCircledOutline,
            action: () => history.push(PATH.STORAGE.IMAGES.CREATE),
          },
          {
            accessor: VM_ACTIONS.CREATE_APP_DIALOG,
            dataCy: `image_${VM_ACTIONS.CREATE_APP_DIALOG}`,
            disabled: isDisabled(VM_ACTIONS.CREATE_APP_DIALOG),
            tooltip: T.CreateMarketApp,
            selected: { max: 1 },
            icon: Cart,
            action: (rows) => {
              const vm = rows?.[0]?.original ?? {}
              const path = PATH.STORAGE.MARKETPLACE_APPS.CREATE

              history.push(path, [RESOURCE_NAMES.VM, vm])
            },
          },
          {
            accessor: IMAGE_ACTIONS.CLONE,
            label: T.Clone,
            tooltip: T.Clone,
            selected: true,
            color: 'secondary',
            options: [
              {
                dialogProps: {
                  title: (rows) => {
                    const isMultiple = rows?.length > 1
                    const { ID, NAME } = rows?.[0]?.original ?? {}

                    return [
                      Tr(
                        isMultiple ? T.CloneSeveralTemplates : T.CloneTemplate
                      ),
                      !isMultiple && `#${ID} ${NAME}`,
                    ]
                      .filter(Boolean)
                      .join(' - ')
                  },
                  dataCy: 'modal-clone',
                },
                form: (rows) => {
                  const names = rows?.map(({ original }) => original?.NAME)
                  const stepProps = { isMultiple: names.length > 1 }
                  const initialValues = { name: `Copy of ${names?.[0]}` }

                  return CloneForm({ stepProps, initialValues })
                },
                onSubmit:
                  (rows) =>
                  async ({ prefix, name, datastore } = {}) => {
                    const images = rows?.map?.(
                      ({ original: { ID, NAME } = {} }) =>
                        // overwrite all names with prefix+NAME
                        ({
                          id: ID,
                          name: prefix ? `${prefix} ${NAME}` : name,
                          datastore,
                        })
                    )

                    await Promise.all(images.map(clone))
                  },
              },
            ],
          },
          {
            tooltip: T.Lock,
            icon: Lock,
            selected: true,
            color: 'secondary',
            dataCy: 'image-lock',
            options: [
              {
                accessor: IMAGE_ACTIONS.LOCK,
                name: T.Lock,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Lock,
                  dataCy: `modal-${IMAGE_ACTIONS.LOCK}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => lock({ id })))
                },
              },
              {
                accessor: IMAGE_ACTIONS.UNLOCK,
                name: T.Unlock,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Unlock,
                  dataCy: `modal-${IMAGE_ACTIONS.UNLOCK}`,
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
            tooltip: T.Enable,
            icon: MoreVert,
            selected: true,
            color: 'secondary',
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
              {
                accessor: IMAGE_ACTIONS.PERSISTENT,
                name: T.Persistent,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Persistent,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${IMAGE_ACTIONS.PERSISTENT}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => persistent({ id, persistent: true }))
                  )
                },
              },
              {
                accessor: IMAGE_ACTIONS.NON_PERSISTENT,
                name: T.NonPersistent,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.NonPersistent,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${IMAGE_ACTIONS.NON_PERSISTENT}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => persistent({ id, persistent: false }))
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
            color: 'error',
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
                },
              },
            ],
          },
        ],
      }),
    [view]
  )

  return imageActions
}

export default Actions
