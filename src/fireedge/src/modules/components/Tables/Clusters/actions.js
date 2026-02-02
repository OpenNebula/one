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
import { Box, Alert, Typography } from '@mui/material'
import { Plus, Trash } from 'iconoir-react'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import { ClusterAPI, ProvisionAPI, useViews } from '@FeaturesModule'

import {
  createActions,
  GlobalAction,
} from '@modules/components/Tables/Enhanced/Utils'

import { Translate, Tr } from '@modules/components/HOC'
import { PATH } from '@modules/components/path'
import { CreateAction } from '@modules/components/Tables/Clusters/CreateAction'

import {
  CLUSTER_ACTIONS,
  PROVISION_ACTIONS,
  RESOURCE_NAMES,
  STYLE_BUTTONS,
  T,
} from '@ConstantsModule'

const ListClusterNames = ({ rows = [] }) =>
  rows?.map?.(({ id, original }) => {
    const { ID, NAME } = original

    return (
      <Typography
        key={`cluster-${id}`}
        variant="inherit"
        component="span"
        display="block"
      >
        {`#${ID} ${NAME}`}
      </Typography>
    )
  })

const ListCloudClustersNames = ({ rows = [] }) =>
  rows?.map?.(({ id, original }) => {
    const { ID, NAME } = original

    return (
      <Typography
        key={`cluster-${id}`}
        variant="inherit"
        component="span"
        display="block"
      >
        <Box
          display="grid"
          gap="1em"
          sx={{
            gridColumn: '1 / -1',
            marginTop: '1em',
            backgroundColor: 'background.paper',
          }}
        >
          <Alert
            severity="warning"
            variant="outlined"
            sx={{ bgcolor: 'background.paper' }}
          >
            {`#${ID} ${NAME} ${Tr(T['oneform.provision.delete'])}`}
          </Alert>
        </Box>
      </Typography>
    )
  })

const MessageToConfirmAction = (rows, description) => {
  const cloudClusters = rows.filter(
    ({ original }) => original?.TEMPLATE.ONEFORM
  )

  return (
    <>
      {cloudClusters.length > 0 ? (
        <ListCloudClustersNames rows={cloudClusters} />
      ) : (
        <ListClusterNames rows={rows} />
      )}
      {description && <Translate word={description} />}
      <Translate word={T.DoYouWantProceed} />
    </>
  )
}

MessageToConfirmAction.displayName = 'MessageToConfirmAction'

/**
 * Generates the actions to operate resources on Clusters table.
 *
 * @param {object} props - datatable props
 * @param {Function} props.setSelectedRows - set selected rows
 * @returns {GlobalAction} - Actions
 */
const Actions = (props = {}) => {
  const { setSelectedRows } = props
  const history = useHistory()
  const { view, getResourceView } = useViews()
  const [remove] = ClusterAPI.useRemoveClusterMutation()
  const [removeProvision] = ProvisionAPI.useRemoveProvisionMutation()
  const [deprovision] = ProvisionAPI.useUndeployProvisionMutation()
  const [retry] = ProvisionAPI.useRetryProvisionMutation()

  return useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.CLUSTER)?.actions,
        actions: [
          {
            accessor: CLUSTER_ACTIONS.CREATE_DIALOG,
            tooltip: T.Create,
            label: T.Create,
            icon: Plus,
            importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.FILLED,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T['cluster.create.selection.head'],
                  children: () => <CreateAction />,
                  fixedWidth: false,
                  fixedHeight: false,
                  handleAccept: undefined,
                },
              },
            ],
          },
          {
            accessor: CLUSTER_ACTIONS.UPDATE_DIALOG,
            label: T.Update,
            tooltip: T.Update,
            selected: { max: 1 },
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            disabled: (rows) =>
              rows.some(({ original }) => original?.TEMPLATE?.ONEFORM),
            action: (rows) => {
              const cluster = rows?.[0]?.original ?? {}
              const path = PATH.INFRASTRUCTURE.CLUSTERS.CREATE

              history.push(path, cluster)
            },
          },
          {
            accessor: PROVISION_ACTIONS.DEPROVISION,
            label: T.Deprovision,
            tooltip: T.Deprovision,
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            selected: { min: 1 },
            dataCy: `cluster_${PROVISION_ACTIONS.DEPROVISION}`,
            disabled: (rows) =>
              rows.some(({ original }) => !original?.TEMPLATE?.ONEFORM),
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.DEPROVISION,
                  dataCy: `modal-${PROVISION_ACTIONS.DEPROVISION}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(
                    ({ original }) => original?.TEMPLATE?.ONEFORM?.PROVISION_ID
                  )
                  await Promise.all(ids.map((id) => deprovision({ id })))
                  setSelectedRows && setSelectedRows([])
                },
              },
            ],
          },
          {
            accessor: PROVISION_ACTIONS.RETRY,
            tooltip: T.Retry,
            label: T.Retry,
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            selected: { min: 1 },
            dataCy: `cluster_${PROVISION_ACTIONS.RETRY}`,
            disabled: (rows) =>
              rows.some(({ original }) => !original?.TEMPLATE?.ONEFORM),
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Retry,
                  dataCy: `modal-${PROVISION_ACTIONS.RETRY}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => retry({ id })))
                  setSelectedRows && setSelectedRows([])
                },
              },
            ],
          },
          {
            accessor: CLUSTER_ACTIONS.DELETE,
            tooltip: T.Delete,
            icon: Trash,
            importance: STYLE_BUTTONS.IMPORTANCE.DANGER,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            selected: { min: 1 },
            dataCy: `cluster_${CLUSTER_ACTIONS.DELETE}`,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Delete,
                  dataCy: `modal-${CLUSTER_ACTIONS.DELETE}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const idsWithType = rows?.map?.(({ original }) => ({
                    id: original?.ID,
                    type: original?.TEMPLATE?.ONEFORM?.PROVISION_ID
                      ? 'removeProvision'
                      : 'remove',
                    provisionId:
                      original?.TEMPLATE?.ONEFORM?.PROVISION_ID ?? -1,
                  }))
                  await Promise.all(
                    idsWithType.map(({ id, type, provisionId }) => {
                      if (type === 'removeProvision') {
                        return removeProvision({ id: provisionId, force: true })
                      }

                      return remove({ id })
                    })
                  )
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
