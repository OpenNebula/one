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
import {
  ClusterAPI,
  DatastoreAPI,
  useGeneralApi,
  useViews,
} from '@FeaturesModule'
import { ChangeClusterForm } from '@modules/components/Forms/Cluster'
import { ChangeGroupForm, ChangeUserForm } from '@modules/components/Forms/Vm'
import { Translate } from '@modules/components/HOC'
import {
  GlobalAction,
  createActions,
} from '@modules/components/Tables/Enhanced/Utils'
import { Group, MoreVert, Plus, Trash } from 'iconoir-react'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import {
  DATASTORE_ACTIONS,
  RESOURCE_NAMES,
  STYLE_BUTTONS,
  T,
} from '@ConstantsModule'
import { PATH } from '@modules/components/path'

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
 * @param {object} props - datatable props
 * @param {Function} props.setSelectedRows - set selected rows
 * @returns {GlobalAction} - Actions
 */
const Actions = (props = {}) => {
  const { setSelectedRows } = props
  const history = useHistory()
  const { view, getResourceView } = useViews()
  const [enable] = DatastoreAPI.useEnableDatastoreMutation()
  const [remove] = DatastoreAPI.useRemoveDatastoreMutation()
  const [disable] = DatastoreAPI.useDisableDatastoreMutation()
  const [changeOwnership] = DatastoreAPI.useChangeDatastoreOwnershipMutation()
  const [addCluster] = ClusterAPI.useAddDatastoreToClusterMutation()
  const [removeCluster] = ClusterAPI.useRemoveDatastoreFromClusterMutation()
  const { setSecondTitle } = useGeneralApi()

  const datastoreActions = useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.DATASTORE)?.actions,
        actions: [
          {
            accessor: DATASTORE_ACTIONS.CREATE_DIALOG,
            dataCy: `datastore_${DATASTORE_ACTIONS.CREATE_DIALOG}`,
            tooltip: T.Create,
            label: T.Create,
            icon: Plus,
            importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.FILLED,
            action: () => {
              setSecondTitle({})
              history.push(PATH.STORAGE.DATASTORES.CREATE)
            },
          },
          {
            accessor: DATASTORE_ACTIONS.CHANGE_CLUSTER,
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            dataCy: `datastore_${DATASTORE_ACTIONS.CHANGE_CLUSTER}`,
            label: T.SelectCluster,
            tooltip: T.SelectCluster,
            selected: { max: 1 },
            options: [
              {
                dialogProps: {
                  title: T.SelectCluster,
                  dataCy: 'modal-select-cluster',
                  validateOn: 'onSubmit',
                },
                form: (rows) =>
                  ChangeClusterForm({
                    initialValues: rows?.[0]?.original?.CLUSTERS?.ID,
                    stepProps: {
                      singleSelect: false,
                    },
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
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
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
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            dataCy: 'datastore-ownership',
            options: [
              {
                accessor: DATASTORE_ACTIONS.CHANGE_OWNER,
                name: T.ChangeOwner,
                dialogProps: {
                  title: T.ChangeOwner,
                  dataCy: `modal-${DATASTORE_ACTIONS.CHANGE_OWNER}`,
                  validateOn: 'onSubmit',
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
            accessor: DATASTORE_ACTIONS.DELETE,
            importance: STYLE_BUTTONS.IMPORTANCE.DANGER,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
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
                  setSelectedRows && setSelectedRows([])
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
