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
  Cart
} from 'iconoir-react'

import { useAuth } from 'client/features/Auth'
import { useVmTemplateApi } from 'client/features/One'

import { CloneForm } from 'client/components/Forms/VmTemplate'
import { createActions } from 'client/components/Tables/Enhanced/Utils'
import { PATH } from 'client/apps/sunstone/routesOne'
import { VM_TEMPLATE_ACTIONS, MARKETPLACE_APP_ACTIONS } from 'client/constants'

const Actions = () => {
  const history = useHistory()
  const { view, getResourceView } = useAuth()
  const {
    getVmTemplate,
    getVmTemplates,
    lock,
    unlock,
    clone,
    remove
  } = useVmTemplateApi()

  const vmTemplateActions = useMemo(() => createActions({
    filters: getResourceView('VM-TEMPLATE')?.actions,
    actions: [
      {
        accessor: VM_TEMPLATE_ACTIONS.REFRESH,
        tooltip: 'Refresh',
        icon: RefreshDouble,
        action: async () => {
          await getVmTemplates()
        }
      },
      {
        accessor: VM_TEMPLATE_ACTIONS.CREATE_DIALOG,
        tooltip: 'Create',
        icon: AddSquare,
        disabled: true,
        action: rows => {
          // TODO: go to CREATE form
          // const { ID } = rows?.[0]?.original ?? {}
          // const path = generatePath(PATH.TEMPLATE.VMS.CREATE, { id: ID })

          // history.push(path)
        }
      },
      {
        accessor: VM_TEMPLATE_ACTIONS.IMPORT_DIALOG,
        tooltip: 'Import',
        icon: Import,
        selected: { max: 1 },
        disabled: true,
        action: rows => {
          // TODO: go to IMPORT form
        }
      },
      {
        accessor: VM_TEMPLATE_ACTIONS.INSTANTIATE_DIALOG,
        label: 'Instantiate',
        tooltip: 'Instantiate',
        icon: PlayOutline,
        selected: { max: 1 },
        action: rows => {
          const template = rows?.[0]?.original ?? {}
          const path = PATH.TEMPLATE.VMS.INSTANTIATE

          history.push(path, template)
        }
      },
      {
        accessor: VM_TEMPLATE_ACTIONS.UPDATE_DIALOG,
        label: 'Update',
        tooltip: 'Update',
        selected: { max: 1 },
        disabled: true,
        action: rows => {
        // const { ID } = rows?.[0]?.original ?? {}
        // const path = generatePath(PATH.TEMPLATE.VMS.CREATE, { id: ID })

        // history.push(path)
        }
      },
      {
        accessor: VM_TEMPLATE_ACTIONS.CLONE,
        label: 'Clone',
        tooltip: 'Clone',
        selected: true,
        options: [{
          dialogProps: {
            title: rows => {
              const isMultiple = rows?.length > 1
              const { ID, NAME } = rows?.[0]?.original

              return [
                isMultiple ? 'Clone several Templates' : 'Clone Template',
                !isMultiple && `#${ID} ${NAME}`
              ].filter(Boolean).join(' - ')
            }
          },
          form: rows => {
            const vmTemplates = rows?.map(({ original }) => original)
            const stepProps = { isMultiple: vmTemplates.length > 1 }
            const initialValues = { name: `Copy of ${vmTemplates?.[0]?.NAME}` }

            return CloneForm(stepProps, initialValues)
          },
          onSubmit: async (formData, rows) => {
            try {
              const { prefix } = formData

              const vmTemplates = rows?.map?.(({ original: { ID, NAME } = {} }) => {
                // overwrite all names with prefix+NAME
                const formatData = prefix ? { name: `${prefix} ${NAME}` } : {}

                return { id: ID, data: { ...formData, ...formatData } }
              })

              await Promise.all(vmTemplates.map(({ id, data }) => clone(id, data)))
            } finally {
              await getVmTemplates()
            }
          }
        }]
      },
      {
        tooltip: 'Change ownership',
        icon: Group,
        selected: true,
        options: [{
          cy: `action.${VM_TEMPLATE_ACTIONS.CHANGE_OWNER}`,
          name: 'Change owner',
          disabled: true,
          isConfirmDialog: true,
          onSubmit: () => undefined
        }, {
          cy: `action.${VM_TEMPLATE_ACTIONS.CHANGE_GROUP}`,
          name: 'Change group',
          disabled: true,
          isConfirmDialog: true,
          onSubmit: () => undefined
        }, {
          cy: `action.${VM_TEMPLATE_ACTIONS.SHARE}`,
          disabled: true,
          name: 'Share',
          isConfirmDialog: true,
          onSubmit: () => undefined
        }, {
          cy: `action.${VM_TEMPLATE_ACTIONS.UNSHARE}`,
          disabled: true,
          name: 'Unshare',
          isConfirmDialog: true,
          onSubmit: () => undefined
        }]
      },
      {
        tooltip: 'Lock/Unlock',
        icon: Lock,
        selected: true,
        options: [{
          cy: `action.${VM_TEMPLATE_ACTIONS.LOCK}`,
          name: 'Lock',
          isConfirmDialog: true,
          dialogProps: {
            title: 'Lock',
            children: rows => {
              const templates = rows?.map?.(({ original }) => original?.NAME)
              return 'Templates: ' + templates.join(', ')
            }
          },
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => lock(id)))
            await Promise.all(ids.map(id => getVmTemplate(id)))
          }
        }, {
          cy: `action.${VM_TEMPLATE_ACTIONS.UNLOCK}`,
          name: 'Unlock',
          isConfirmDialog: true,
          dialogProps: {
            title: 'Unlock',
            children: rows => {
              const templates = rows?.map?.(({ original }) => original?.NAME)
              return 'Templates: ' + templates.join(', ')
            }
          },
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => unlock(id)))
            await Promise.all(ids.map(id => getVmTemplate(id)))
          }
        }]
      },
      {
        accessor: VM_TEMPLATE_ACTIONS.DELETE,
        tooltip: 'Delete',
        icon: Trash,
        selected: true,
        options: [{
          isConfirmDialog: true,
          dialogProps: {
            title: 'Delete',
            children: rows => {
              const templates = rows?.map?.(({ original }) => original?.NAME)
              return 'Templates: ' + templates.join(', ')
            }
          },
          onSubmit: async (_, rows) => {
            const ids = rows?.map?.(({ original }) => original?.ID)
            await Promise.all(ids.map(id => remove(id)))
            await Promise.all(ids.map(id => getVmTemplate(id)))
          }
        }]
      }
    ]
  }), [view])

  const marketplaceAppActions = useMemo(() => createActions({
    filters: getResourceView('MARKETPLACE-APP')?.actions,
    actions: [
      {
        accessor: MARKETPLACE_APP_ACTIONS.CREATE_DIALOG,
        tooltip: 'Create Marketplace App',
        icon: Cart,
        selected: { max: 1 },
        disabled: true,
        action: rows => {
          // TODO: go to Marketplace App CREATE form
        }
      }
    ]
  }), [view])

  return [...vmTemplateActions, ...marketplaceAppActions]
}

export default Actions