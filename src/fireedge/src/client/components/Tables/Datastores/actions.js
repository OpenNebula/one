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
import { ChangeClusterForm } from 'client/components/Forms/Cluster'
import { ChangeGroupForm, ChangeUserForm } from 'client/components/Forms/Vm'
import { Translate } from 'client/components/HOC'
import {
  GlobalAction,
  createActions,
} from 'client/components/Tables/Enhanced/Utils'
import { useViews } from 'client/features/Auth'
import {
  useAddDatastoreToClusterMutation,
  useRemoveDatastoreFromClusterMutation,
} from 'client/features/OneApi/cluster'
import {
  useChangeDatastoreOwnershipMutation,
  useDisableDatastoreMutation,
  useEnableDatastoreMutation,
  useRemoveDatastoreMutation,
} from 'client/features/OneApi/datastore'
import { AddCircledOutline, Group, MoreVert, Trash } from 'iconoir-react'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import { PATH } from 'client/apps/sunstone/routesOne'
import { DATASTORE_ACTIONS, RESOURCE_NAMES, T } from 'client/constants'

const MessageToConfirmAction = (rows) => {
  const names = rows?.map?.(({ original }) => original?.NAME)

  return (
    <>
      <p>
        <Translate word={T.Datastores} />
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
 * Generates the actions to operate resources on Datastore table.
 *
 * @returns {GlobalAction} - Actions
 */
const Actions = () => {
  const history = useHistory()
  const { view, getResourceView } = useViews()
  const [enable] = useEnableDatastoreMutation()
  const [remove] = useRemoveDatastoreMutation()
  const [disable] = useDisableDatastoreMutation()
  const [changeOwnership] = useChangeDatastoreOwnershipMutation()
  const [addCluster] = useAddDatastoreToClusterMutation()
  const [removeCluster] = useRemoveDatastoreFromClusterMutation()

  const datastoreActions = useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.DATASTORE)?.actions,
        actions: [
          {
            accessor: DATASTORE_ACTIONS.CREATE_DIALOG,
            dataCy: `datastore_${DATASTORE_ACTIONS.CREATE_DIALOG}`,
            tooltip: T.Create,
            icon: AddCircledOutline,
            action: () => history.push(PATH.STORAGE.DATASTORES.CREATE),
          },
          {
            accessor: DATASTORE_ACTIONS.CHANGE_CLUSTER,
            color: 'secondary',
            dataCy: `datastore_${DATASTORE_ACTIONS.CHANGE_CLUSTER}`,
            label: T.SelectCluster,
            tooltip: T.SelectCluster,
            selected: { max: 1 },
            options: [
              {
                dialogProps: {
                  title: T.SelectCluster,
                  dataCy: 'modal-select-cluster',
                },
                form: (rows) =>
                  ChangeClusterForm({
                    initialValues: rows?.[0]?.original?.CLUSTERS?.ID,
                  }),
                onSubmit: (rows) => async (formData) => {
                  const row = rows[0]
                  const dsId = row.id

                  const oldClusters = Array.isArray(row.original?.CLUSTERS?.ID)
                    ? row.original?.CLUSTERS?.ID
                    : [row.original?.CLUSTERS?.ID]

                  const newClusters = formData.cluster.filter(
                    (clusterId) => !oldClusters.includes(clusterId)
                  )
                  const removedClusters = oldClusters.filter(
                    (clusterId) => !formData.cluster.includes(clusterId)
                  )

                  await Promise.all(
                    newClusters.map((clusterId) =>
                      addCluster({ id: clusterId, datastore: dsId })
                    )
                  )

                  await Promise.all(
                    removedClusters.map((clusterId) =>
                      removeCluster({ id: clusterId, datastore: dsId })
                    )
                  )
                },
              },
            ],
          },
          {
            tooltip: T.Enable,
            icon: MoreVert,
            selected: true,
            color: 'secondary',
            dataCy: 'datastore-options',
            options: [
              {
                accessor: DATASTORE_ACTIONS.ENABLE,
                name: T.Enable,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Enable,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${DATASTORE_ACTIONS.ENABLE}`,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => enable(id)))
                },
              },
              {
                accessor: DATASTORE_ACTIONS.DISABLE,
                name: T.Disable,
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Disable,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${DATASTORE_ACTIONS.DISABLE}`,
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
            color: 'secondary',
            dataCy: 'datastore-ownership',
            options: [
              {
                accessor: DATASTORE_ACTIONS.CHANGE_OWNER,
                name: T.ChangeOwner,
                dialogProps: {
                  title: T.ChangeOwner,
                  dataCy: `modal-${DATASTORE_ACTIONS.CHANGE_OWNER}`,
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
                accessor: DATASTORE_ACTIONS.CHANGE_GROUP,
                name: T.ChangeGroup,
                dialogProps: {
                  title: T.ChangeGroup,
                  dataCy: `modal-${DATASTORE_ACTIONS.CHANGE_GROUP}`,
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
            accessor: DATASTORE_ACTIONS.DELETE,
            color: 'error',
            dataCy: 'datastore-delete',
            icon: Trash,
            tooltip: T.Delete,
            selected: true,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Delete,
                  children: MessageToConfirmAction,
                  dataCy: `modal-${DATASTORE_ACTIONS.DELETE}`,
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

  return datastoreActions
}

export default Actions
