/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import {
  RefreshDouble,
  AddSquare,
  Import,
  Trash,
  PlayOutline,
  Lock,
  Group,
  Cart,
} from 'iconoir-react'

import { useAuth } from 'client/features/Auth'
import { useVmTemplateApi } from 'client/features/One'
import { Tr, Translate } from 'client/components/HOC'

import { CloneForm } from 'client/components/Forms/VmTemplate'
import { createActions } from 'client/components/Tables/Enhanced/Utils'
import { PATH } from 'client/apps/sunstone/routesOne'

import {
  T,
  VM_TEMPLATE_ACTIONS,
  MARKETPLACE_APP_ACTIONS,
  RESOURCE_NAMES,
} from 'client/constants'

const MessageToConfirmAction = (rows) => {
  const names = rows?.map?.(({ original }) => original?.NAME)

  return (
    <>
      <p>
        <Translate word={T.VMTemplates} />
        {`: ${names.join(', ')}`}
      </p>
      <p>
        <Translate word={T.DoYouWantProceed} />
      </p>
    </>
  )
}

MessageToConfirmAction.displayName = 'MessageToConfirmAction'

const Actions = () => {
  const history = useHistory()
  const { view, getResourceView } = useAuth()
  const { getVmTemplate, getVmTemplates, lock, unlock, clone, remove } =
    useVmTemplateApi()

  const vmTemplateActions = useMemo(
    () =>
      createActions({
        filters: getResourceView('VM-TEMPLATE')?.actions,
        actions: [
          {
            accessor: VM_TEMPLATE_ACTIONS.REFRESH,
            tooltip: T.Refresh,
            icon: RefreshDouble,
            action: async () => {
              await getVmTemplates()
            },
          },
          {
            accessor: VM_TEMPLATE_ACTIONS.CREATE_DIALOG,
            tooltip: T.Create,
            icon: AddSquare,
            action: () => {
              const path = PATH.TEMPLATE.VMS.CREATE

              history.push(path)
            },
          },
          {
            accessor: VM_TEMPLATE_ACTIONS.IMPORT_DIALOG,
            tooltip: T.Import,
            icon: Import,
            selected: { max: 1 },
            disabled: true,
            action: (rows) => {
              // TODO: go to IMPORT form
            },
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
          },
          {
            accessor: VM_TEMPLATE_ACTIONS.UPDATE_DIALOG,
            label: T.Update,
            tooltip: T.Update,
            selected: { max: 1 },
            color: 'secondary',
            action: (rows) => {
              const vmTemplate = rows?.[0]?.original ?? {}
              const path = PATH.TEMPLATE.VMS.CREATE

              history.push(path, vmTemplate)
            },
          },
          {
            accessor: VM_TEMPLATE_ACTIONS.CLONE,
            label: T.Clone,
            tooltip: T.Clone,
            selected: true,
            color: 'secondary',
            options: [
              {
                dialogProps: {
                  title: (rows) => {
                    const isMultiple = rows?.length > 1
                    const { ID, NAME } = rows?.[0]?.original

                    return [
                      Tr(
                        isMultiple ? T.CloneSeveralTemplates : T.CloneTemplate
                      ),
                      !isMultiple && `#${ID} ${NAME}`,
                    ]
                      .filter(Boolean)
                      .join(' - ')
                  },
                },
                form: (rows) => {
                  const vmTemplates = rows?.map(({ original }) => original)
                  const stepProps = { isMultiple: vmTemplates.length > 1 }
                  const initialValues = {
                    name: `Copy of ${vmTemplates?.[0]?.NAME}`,
                  }

                  return CloneForm(stepProps, initialValues)
                },
                onSubmit: async (formData, rows) => {
                  try {
                    const { prefix } = formData

                    const vmTemplates = rows?.map?.(
                      ({ original: { ID, NAME } = {} }) => {
                        // overwrite all names with prefix+NAME
                        const formatData = prefix
                          ? { name: `${prefix} ${NAME}` }
                          : {}

                        return { id: ID, data: { ...formData, ...formatData } }
                      }
                    )

                    await Promise.all(
                      vmTemplates.map(({ id, data }) => clone(id, data))
                    )
                  } finally {
                    await getVmTemplates()
                  }
                },
              },
            ],
          },
          {
            tooltip: T.Ownership,
            icon: Group,
            selected: true,
            color: 'secondary',
            options: [
              {
                accessor: VM_TEMPLATE_ACTIONS.CHANGE_OWNER,
                name: T.ChangeOwner,
                disabled: true,
                isConfirmDialog: true,
                onSubmit: () => undefined,
              },
              {
                accessor: VM_TEMPLATE_ACTIONS.CHANGE_GROUP,
                name: T.ChangeGroup,
                disabled: true,
                isConfirmDialog: true,
                onSubmit: () => undefined,
              },
              {
                accessor: VM_TEMPLATE_ACTIONS.SHARE,
                disabled: true,
                name: T.Share,
                isConfirmDialog: true,
                onSubmit: () => undefined,
              },
              {
                accessor: VM_TEMPLATE_ACTIONS.UNSHARE,
                disabled: true,
                name: T.Unshare,
                isConfirmDialog: true,
                onSubmit: () => undefined,
              },
            ],
          },
          {
            tooltip: T.Lock,
            icon: Lock,
            selected: true,
            color: 'secondary',
            options: [
              {
                accessor: VM_TEMPLATE_ACTIONS.LOCK,
                name: T.Lock,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Lock,
                  children: MessageToConfirmAction,
                },
                onSubmit: async (_, rows) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => lock(id)))
                  await Promise.all(ids.map((id) => getVmTemplate(id)))
                },
              },
              {
                accessor: VM_TEMPLATE_ACTIONS.UNLOCK,
                name: T.Unlock,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Unlock,
                  children: MessageToConfirmAction,
                },
                onSubmit: async (_, rows) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => unlock(id)))
                  await Promise.all(ids.map((id) => getVmTemplate(id)))
                },
              },
            ],
          },
          {
            accessor: VM_TEMPLATE_ACTIONS.DELETE,
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
                },
                onSubmit: async (_, rows) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => remove(id)))
                  await getVmTemplates()
                },
              },
            ],
          },
        ],
      }),
    [view]
  )

  const marketplaceAppActions = useMemo(
    () =>
      createActions({
        filters: getResourceView('MARKETPLACE-APP')?.actions,
        actions: [
          {
            accessor: MARKETPLACE_APP_ACTIONS.CREATE_DIALOG,
            tooltip: T.CreateMarketApp,
            icon: Cart,
            selected: { max: 1 },
            disabled: true,
            action: (rows) => {
              // TODO: go to Marketplace App CREATE form
            },
          },
        ],
      }),
    [view]
  )

  return [...vmTemplateActions, ...marketplaceAppActions]
}

export default Actions
