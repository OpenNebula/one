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
import { useHistory } from 'react-router-dom'
import { Typography } from '@mui/material'
import { Trash, PlayOutline, Lock, Group, Cart, Plus } from 'iconoir-react'

import { useViews, VmTemplateAPI } from '@FeaturesModule'

import {
  createActions,
  GlobalAction,
} from '@modules/components/Tables/Enhanced/Utils'

import { Tr, Translate } from '@modules/components/HOC'
import { PATH, Form } from '@modules/components'
import {
  T,
  VM_TEMPLATE_ACTIONS,
  RESOURCE_NAMES,
  STYLE_BUTTONS,
} from '@ConstantsModule'
const { Vm, VmTemplate } = Form

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

  const [lock] = VmTemplateAPI.useLockTemplateMutation()
  const [unlock] = VmTemplateAPI.useUnlockTemplateMutation()
  const [clone] = VmTemplateAPI.useCloneTemplateMutation()
  const [remove] = VmTemplateAPI.useRemoveTemplateMutation()
  const [changeOwnership] = VmTemplateAPI.useChangeTemplateOwnershipMutation()
  const [changePermissions] =
    VmTemplateAPI.useChangeTemplatePermissionsMutation()

  return useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.VM_TEMPLATE)?.actions,
        actions: [
          {
            accessor: VM_TEMPLATE_ACTIONS.CREATE_DIALOG,
            label: T.Create,
            tooltip: T.Create,
            icon: Plus,
            action: () => history.push(PATH.TEMPLATE.VMS.CREATE),
            importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.FILLED,
          },
          {
            accessor: VM_TEMPLATE_ACTIONS.INSTANTIATE_DIALOG,
            tooltip: T.Instantiate,
            icon: PlayOutline,
            selected: { max: 1 },
            action: (rows) => {
              const template = rows?.[0]?.original ?? {}
              const path = PATH.TEMPLATE.VMS.INSTANTIATE

              history.push(path, template)
            },
            importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.FILLED,
          },
          {
            accessor: VM_TEMPLATE_ACTIONS.CREATE_APP_DIALOG,
            tooltip: T.CreateMarketApp,
            selected: { max: 1 },
            icon: Cart,
            action: (rows) => {
              const template = rows?.[0]?.original ?? {}
              const path = PATH.STORAGE.MARKETPLACE_APPS.CREATE

              history.push(path, [RESOURCE_NAMES.VM_TEMPLATE, template])
            },
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED_ICON,
          },
          {
            accessor: VM_TEMPLATE_ACTIONS.UPDATE_DIALOG,
            label: T.Update,
            tooltip: T.Update,
            selected: { max: 1 },
            action: (rows) => {
              const vmTemplate = rows?.[0]?.original ?? {}
              const path = PATH.TEMPLATE.VMS.UPDATE

              history.push(path, vmTemplate)
            },
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
          },
          {
            accessor: VM_TEMPLATE_ACTIONS.CLONE,
            label: T.Clone,
            tooltip: T.Clone,
            selected: true,
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

                  return VmTemplate.CloneForm({ stepProps, initialValues })
                },
                onSubmit:
                  (rows) =>
                  async ({ prefix, name, image } = {}) => {
                    const vmTemplates = rows?.map?.(
                      ({ original: { ID, NAME } = {} }) =>
                        // overwrite all names with prefix+NAME
                        ({
                          id: ID,
                          name: prefix ? `${prefix} ${NAME}` : name,
                          image,
                        })
                    )

                    await Promise.all(vmTemplates.map(clone))
                  },
              },
            ],
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
          },
          {
            tooltip: T.Ownership,
            icon: Group,
            selected: true,
            dataCy: 'template-ownership',
            options: [
              {
                accessor: VM_TEMPLATE_ACTIONS.CHANGE_OWNER,
                name: T.ChangeOwner,
                dialogProps: {
                  title: T.ChangeOwner,
                  subheader: SubHeader,
                  dataCy: `modal-${VM_TEMPLATE_ACTIONS.CHANGE_OWNER}`,
                },
                form: Vm.ChangeUserForm,
                onSubmit: (rows) => (newOwnership) => {
                  rows?.map?.(({ original }) =>
                    changeOwnership({ id: original?.ID, ...newOwnership })
                  )
                },
              },
              {
                accessor: VM_TEMPLATE_ACTIONS.CHANGE_GROUP,
                name: T.ChangeGroup,
                dialogProps: {
                  title: T.ChangeGroup,
                  subheader: SubHeader,
                  dataCy: `modal-${VM_TEMPLATE_ACTIONS.CHANGE_GROUP}`,
                },
                form: Vm.ChangeGroupForm,
                onSubmit: (rows) => async (newOwnership) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => changeOwnership({ id, ...newOwnership }))
                  )
                },
              },
              {
                accessor: VM_TEMPLATE_ACTIONS.SHARE,
                name: T.Share,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Share,
                  dataCy: `modal-${VM_TEMPLATE_ACTIONS.SHARE}`,
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
                accessor: VM_TEMPLATE_ACTIONS.UNSHARE,
                name: T.Unshare,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Unshare,
                  dataCy: `modal-${VM_TEMPLATE_ACTIONS.UNSHARE}`,
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
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
          },
          {
            tooltip: T.Lock,
            icon: Lock,
            selected: true,
            dataCy: 'template-lock',
            options: [
              {
                accessor: VM_TEMPLATE_ACTIONS.LOCK,
                name: T.Lock,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Lock,
                  dataCy: `modal-${VM_TEMPLATE_ACTIONS.LOCK}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => lock({ id })))
                },
              },
              {
                accessor: VM_TEMPLATE_ACTIONS.UNLOCK,
                name: T.Unlock,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Unlock,
                  dataCy: `modal-${VM_TEMPLATE_ACTIONS.UNLOCK}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => unlock({ id })))
                },
              },
            ],
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
          },
          {
            accessor: VM_TEMPLATE_ACTIONS.DELETE,
            tooltip: T.Delete,
            icon: Trash,
            selected: true,
            options: [
              {
                dialogProps: {
                  dataCy: `modal-${VM_TEMPLATE_ACTIONS.DELETE}`,
                  title: (rows) => {
                    const isMultiple = rows?.length > 1
                    const { ID, NAME } = rows?.[0]?.original ?? {}

                    return [
                      Tr(
                        isMultiple ? T.DeleteSeveralTemplates : T.DeleteTemplate
                      ),
                      !isMultiple && `#${ID} ${NAME}`,
                    ]
                      .filter(Boolean)
                      .join(' - ')
                  },
                },
                form: VmTemplate.DeleteForm,
                onSubmit: (rows) => async (formData) => {
                  const { image } = formData ?? {}
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => remove({ id, image })))
                },
              },
            ],
            importance: STYLE_BUTTONS.IMPORTANCE.DANGER,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
          },
        ],
      }),
    [view]
  )
}

export default Actions
