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
import { Plus, Trash } from 'iconoir-react'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import {
  HOST_ACTIONS,
  HOST_STATES,
  RESOURCE_NAMES,
  STATES,
  STYLE_BUTTONS,
  T,
} from '@ConstantsModule'
import {
  ClusterAPI,
  HostAPI,
  oneApi,
  useGeneralApi,
  useViews,
} from '@FeaturesModule'
import { ChangeClusterForm } from '@modules/components/Forms/Cluster'
import { Translate } from '@modules/components/HOC'
import { PATH } from '@modules/components/path'
import {
  createActions,
  GlobalAction,
} from '@modules/components/Tables/Enhanced/Utils'
import { formatError } from '@UtilsModule'
import { useDispatch } from 'react-redux'

const isDisabled = (action) => (rows) =>
  rows
    .map(({ original }) => original)
    .every(({ STATE }) => HOST_STATES[STATE].name === action)

const ListHostNames = ({ rows = [] }) =>
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

const MessageToConfirmActionStyled = (rows) => (
  <>
    <ListHostNames rows={rows} />
    <Translate word={T.DoYouWantProceed} />
  </>
)

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
 * @param {object} props - datatable props
 * @param {Function} props.setSelectedRows - set selected rows
 * @returns {GlobalAction} - Actions
 */
const Actions = (props = {}) => {
  const { setSelectedRows } = props
  const dispatch = useDispatch()
  const { enqueueError, enqueueInfo } = useGeneralApi()
  const history = useHistory()
  const { view, getResourceView } = useViews()
  const [enable] = HostAPI.useEnableHostMutation()
  const [remove] = HostAPI.useRemoveHostMutation()
  const [disable] = HostAPI.useDisableHostMutation()
  const [offline] = HostAPI.useOfflineHostMutation()
  const [changeCluster] = ClusterAPI.useAddHostToClusterMutation()

  const hostActions = useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.HOST)?.actions,
        actions: [
          {
            accessor: HOST_ACTIONS.CREATE_DIALOG,
            dataCy: `host_${HOST_ACTIONS.CREATE_DIALOG}`,
            tooltip: T.Create,
            label: T.Create,
            icon: Plus,
            importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.FILLED,
            action: () => history.push(PATH.INFRASTRUCTURE.HOSTS.CREATE),
          },
          {
            accessor: HOST_ACTIONS.CHANGE_CLUSTER,
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            dataCy: `host-${HOST_ACTIONS.CHANGE_CLUSTER}`,
            label: T.SelectCluster,
            tooltip: T.SelectCluster,
            selected: true,
            options: [
              {
                dialogProps: {
                  title: T.SelectCluster,
                  dataCy: 'modal-select-cluster',
                  validateOn: 'onBlur',
                },
                form: () => ChangeClusterForm(),
                onSubmit: (rows) => async (formData) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  const clusterId = formData?.cluster
                  await Promise.all(
                    ids.map((id) => changeCluster({ id: clusterId, host: id }))
                  )
                },
              },
            ],
          },
          {
            accessor: HOST_ACTIONS.ENABLE,
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            dataCy: `host_${HOST_ACTIONS.ENABLE}`,
            label: T.Enable,
            disabled: isDisabled(STATES.MONITORED),
            tooltip: T.Enable,
            selected: true,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Enable,
                  dataCy: `modal_${HOST_ACTIONS.ENABLE}`,
                  children: MessageToConfirmActionStyled,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => enable(id)))
                },
              },
            ],
          },
          {
            accessor: HOST_ACTIONS.DISABLE,
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            dataCy: `host_${HOST_ACTIONS.DISABLE}`,
            label: T.Disable,
            disabled: isDisabled(STATES.DISABLED),
            tooltip: T.Disable,
            selected: true,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Disable,
                  dataCy: `modal_${HOST_ACTIONS.DISABLE}`,
                  children: MessageToConfirmActionStyled,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => disable(id)))
                },
              },
            ],
          },
          {
            accessor: HOST_ACTIONS.OFFLINE,
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            dataCy: `host_${HOST_ACTIONS.OFFLINE}`,
            label: T.Offline,
            tooltip: T.Offline,
            selected: true,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Offline,
                  dataCy: `modal_${HOST_ACTIONS.OFFLINE}`,
                  children: MessageToConfirmActionStyled,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => offline(id)))
                },
              },
            ],
          },
          {
            accessor: HOST_ACTIONS.FLUSH,
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            dataCy: `host_${HOST_ACTIONS.FLUSH}`,
            label: T.Flush,
            tooltip: T.Flush,
            selected: { max: 1 },
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Flush,
                  dataCy: `modal_${HOST_ACTIONS.FLUSH}`,
                  children: MessageToConfirmActionStyled,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map(async (id) => {
                      const result = await dispatch(
                        oneApi.endpoints.flush.initiate(id)
                      )
                      const isError = Object.keys(result?.data).length <= 0
                      !isError
                        ? enqueueInfo(T.InfoHostFlush, [
                            result?.data?.HOST?.ID ?? T.NotFound,
                          ])
                        : enqueueError(formatError(result?.error?.data?.data))
                    })
                  )
                },
              },
            ],
          },
          {
            accessor: HOST_ACTIONS.DELETE,
            importance: STYLE_BUTTONS.IMPORTANCE.DANGER,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
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
                  setSelectedRows && setSelectedRows([])
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
