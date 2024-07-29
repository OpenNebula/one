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
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { AddCircledOutline, Trash } from 'iconoir-react'

import { useViews } from 'client/features/Auth'
import { useAddHostToClusterMutation } from 'client/features/OneApi/cluster'
import {
  useDisableHostMutation,
  useEnableHostMutation,
  useOfflineHostMutation,
  useRemoveHostMutation,
} from 'client/features/OneApi/host'
import { Translate } from 'client/components/HOC'

import { ChangeClusterForm } from 'client/components/Forms/Cluster'
import {
  createActions,
  GlobalAction,
} from 'client/components/Tables/Enhanced/Utils'

import { PATH } from 'client/apps/sunstone/routesOne'
import { T, HOST_ACTIONS, RESOURCE_NAMES } from 'client/constants'

const MessageToConfirmAction = (rows) => {
  const names = rows?.map?.(({ original }) => original?.NAME)

  return (
    <>
      <p>
        <Translate word={T.Hosts} />
        {`: ${names.join(', ')}`}
      </p>
      <p>
        <Translate word={T.DoYouWantProceed} />
      </p>
    </>
  )
}

MessageToConfirmAction.displayName = 'MessageToConfirmAction'

/**
 * Generates the actions to operate resources on Host table.
 *
 * @returns {GlobalAction} - Actions
 */
const Actions = () => {
  const history = useHistory()
  const { view, getResourceView } = useViews()
  const [enable] = useEnableHostMutation()
  const [remove] = useRemoveHostMutation()
  const [disable] = useDisableHostMutation()
  const [offline] = useOfflineHostMutation()
  const [changeCluster] = useAddHostToClusterMutation()

  const hostActions = useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.HOST)?.actions,
        actions: [
          {
            accessor: HOST_ACTIONS.CREATE_DIALOG,
            dataCy: `host_${HOST_ACTIONS.CREATE_DIALOG}`,
            tooltip: T.Create,
            icon: AddCircledOutline,
            action: () => history.push(PATH.INFRASTRUCTURE.HOSTS.CREATE),
          },
          {
            accessor: HOST_ACTIONS.CHANGE_CLUSTER,
            color: 'secondary',
            dataCy: `host-${HOST_ACTIONS.CHANGE_CLUSTER}`,
            label: T.SelectCluster,
            tooltip: T.SelectCluster,
            selected: true,
            options: [
              {
                dialogProps: {
                  title: T.SelectCluster,
                  dataCy: 'modal-select-cluster',
                },
                form: (rows) => ChangeClusterForm(),
                onSubmit: (rows) => async (formData) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) =>
                      changeCluster({ id: formData.cluster, host: id })
                    )
                  )
                },
              },
            ],
          },
          {
            accessor: HOST_ACTIONS.ENABLE,
            color: 'secondary',
            dataCy: `host_${HOST_ACTIONS.ENABLE}`,
            label: T.Enable,
            tooltip: T.Enable,
            selected: true,
            action: async (rows) => {
              const ids = rows?.map?.(({ original }) => original?.ID)
              await Promise.all(ids.map((id) => enable(id)))
            },
          },
          {
            accessor: HOST_ACTIONS.DISABLE,
            color: 'secondary',
            dataCy: `host_${HOST_ACTIONS.DISABLE}`,
            label: T.Disable,
            tooltip: T.Disable,
            selected: true,
            action: async (rows) => {
              const ids = rows?.map?.(({ original }) => original?.ID)
              await Promise.all(ids.map((id) => disable(id)))
            },
          },
          {
            accessor: HOST_ACTIONS.OFFLINE,
            color: 'secondary',
            dataCy: `host_${HOST_ACTIONS.OFFLINE}`,
            label: T.Offline,
            tooltip: T.Offline,
            selected: true,
            action: async (rows) => {
              const ids = rows?.map?.(({ original }) => original?.ID)
              await Promise.all(ids.map((id) => offline(id)))
            },
          },
          {
            accessor: HOST_ACTIONS.DELETE,
            color: 'error',
            dataCy: 'host-delete',
            icon: Trash,
            tooltip: T.Delete,
            selected: true,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Delete,
                  children: MessageToConfirmAction,
                  dataCy: `modal-host-${HOST_ACTIONS.DELETE}`,
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

  return hostActions
}

export default Actions
