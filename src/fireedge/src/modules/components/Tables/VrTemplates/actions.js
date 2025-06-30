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
import { Group, Lock, PlayOutline, Plus, Trash } from 'iconoir-react'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import { useViews, VmTemplateAPI, VrTemplateAPI } from '@FeaturesModule'

import { ChangeGroupForm, ChangeUserForm } from '@modules/components/Forms/Vm'
import { CloneForm, DeleteForm } from '@modules/components/Forms/VmTemplate'
import {
  createActions,
  GlobalAction,
} from '@modules/components/Tables/Enhanced/Utils'

import {
  RESOURCE_NAMES,
  STYLE_BUTTONS,
  T,
  VROUTER_TEMPLATE_ACTIONS,
} from '@ConstantsModule'
import { Tr, Translate } from '@modules/components/HOC'
import { PATH } from '@modules/components/path'

const ListVrTemplateNames = ({ rows = [] }) =>
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

const SubHeader = (rows) => <ListVrTemplateNames rows={rows} />

const MessageToConfirmAction = (rows, description) => (
  <>
    <ListVrTemplateNames rows={rows} />
    {description && <Translate word={description} />}
    <Translate word={T.DoYouWantProceed} />
  </>
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
  const history = useHistory()
  const { setSelectedRows } = props
  const { view, getResourceView } = useViews()

  const [fetchVrs] = VrTemplateAPI.useLazyGetVrTemplatesQuery()
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
        filters: getResourceView(RESOURCE_NAMES.VROUTER_TEMPLATE)?.actions,
        actions: [
          {
            accessor: VROUTER_TEMPLATE_ACTIONS.CREATE_DIALOG,
            tooltip: T.Create,
            label: T.Create,
            icon: Plus,
            importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.FILLED,
            action: () => history.push(PATH.TEMPLATE.VROUTERS.CREATE),
          },
          {
            accessor: VROUTER_TEMPLATE_ACTIONS.INSTANTIATE_DIALOG,
            tooltip: T.Instantiate,
            icon: PlayOutline,
            selected: { max: 1 },
            importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.FILLED,
            action: (rows) => {
              const template = rows?.[0]?.original ?? {}
              const path = PATH.TEMPLATE.VROUTERS.INSTANTIATE

              history.push(path, template)
            },
          },
          {
            accessor: VROUTER_TEMPLATE_ACTIONS.UPDATE_DIALOG,
            label: T.Update,
            tooltip: T.Update,
            selected: { max: 1 },
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            action: (rows) => {
              const template = rows?.[0]?.original ?? {}
              const path = PATH.TEMPLATE.VROUTERS.CREATE

              history.push(path, template)
            },
          },
          {
            accessor: VROUTER_TEMPLATE_ACTIONS.CLONE,
            label: T.Clone,
            tooltip: T.Clone,
            selected: true,
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
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
                accessor: VROUTER_TEMPLATE_ACTIONS.CHANGE_OWNER,
                name: T.ChangeOwner,
                dialogProps: {
                  title: T.ChangeOwner,
                  subheader: SubHeader,
                  dataCy: `modal-${VROUTER_TEMPLATE_ACTIONS.CHANGE_OWNER}`,
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
                accessor: VROUTER_TEMPLATE_ACTIONS.CHANGE_GROUP,
                name: T.ChangeGroup,
                dialogProps: {
                  title: T.ChangeGroup,
                  subheader: SubHeader,
                  dataCy: `modal-${VROUTER_TEMPLATE_ACTIONS.CHANGE_GROUP}`,
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
              {
                accessor: VROUTER_TEMPLATE_ACTIONS.SHARE,
                name: T.Share,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Share,
                  dataCy: `modal-${VROUTER_TEMPLATE_ACTIONS.SHARE}`,
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
                accessor: VROUTER_TEMPLATE_ACTIONS.UNSHARE,
                name: T.Unshare,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Unshare,
                  dataCy: `modal-${VROUTER_TEMPLATE_ACTIONS.UNSHARE}`,
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
          },
          {
            tooltip: T.Lock,
            icon: Lock,
            selected: true,
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            dataCy: 'template-lock',
            options: [
              {
                accessor: VROUTER_TEMPLATE_ACTIONS.LOCK,
                name: T.Lock,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Lock,
                  dataCy: `modal-${VROUTER_TEMPLATE_ACTIONS.LOCK}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => lock({ id }) && fetchVrs()))
                },
              },
              {
                accessor: VROUTER_TEMPLATE_ACTIONS.UNLOCK,
                name: T.Unlock,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Unlock,
                  dataCy: `modal-${VROUTER_TEMPLATE_ACTIONS.UNLOCK}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => unlock({ id }) && fetchVrs())
                  )
                },
              },
            ],
          },
          {
            accessor: VROUTER_TEMPLATE_ACTIONS.DELETE,
            tooltip: T.Delete,
            icon: Trash,
            selected: true,
            importance: STYLE_BUTTONS.IMPORTANCE.DANGER,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            options: [
              {
                dialogProps: {
                  dataCy: `modal-${VROUTER_TEMPLATE_ACTIONS.DELETE}`,
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
                form: DeleteForm,
                onSubmit: (rows) => async (formData) => {
                  const { image } = formData ?? {}
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => remove({ id, image })))
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
