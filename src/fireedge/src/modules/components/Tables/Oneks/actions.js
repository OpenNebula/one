/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { Tr, Translate } from '@modules/components/HOC'
import { useGeneralApi, useViews, OneKsAPI } from '@FeaturesModule'
import { DeleteOneKsClusterForm } from '@modules/components/Forms/OneKs'
import {
  createActions,
  GlobalAction,
} from '@modules/components/Tables/Enhanced/Utils'

import {
  ONEKS_ACTIONS,
  RESOURCE_NAMES,
  STYLE_BUTTONS,
  T,
} from '@ConstantsModule'
import { PATH } from '@modules/components/path'

const ListClusterNames = ({ rows = [] }) =>
  rows?.map?.(({ id, original }) => {
    const { ID, NAME } = original

    return (
      <Typography
        key={`oneks-${id}`}
        variant="inherit"
        component="span"
        display="block"
      >
        {`#${ID} ${NAME}`}
      </Typography>
    )
  })

const MessageToConfirmAction = (rows, description) => (
  <>
    <ListClusterNames rows={rows} />
    {description && <Translate word={description} />}
    <Translate word={T.DoYouWantProceed} />
  </>
)

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
  const { setSecondTitle } = useGeneralApi()
  const [remove] = OneKsAPI.useDeleteOneKsClusterMutation()
  const [recover] = OneKsAPI.useRecoverOneKsClusterMutation()

  return useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.ONEKS)?.actions,
        actions: [
          {
            accessor: ONEKS_ACTIONS.CREATE_DIALOG,
            tooltip: T.Create,
            label: T.Create,
            icon: Plus,
            importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.FILLED,
            dataCy: `oneks_${ONEKS_ACTIONS.CREATE_DIALOG}`,
            action: () => {
              setSecondTitle({})
              history.push(PATH.ONEKS.CREATE)
            },
          },
          {
            accessor: ONEKS_ACTIONS.RECOVER,
            dataCy: `oneks_${ONEKS_ACTIONS.RECOVER}`,
            tooltip: T.Recover,
            label: T.Recover,
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            selected: { min: 1 },
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  dataCy: `modal-${ONEKS_ACTIONS.RECOVER}`,
                  title: (rows) => {
                    const isMultiple = rows?.length > 1
                    const { ID, NAME } = rows?.[0]?.original ?? {}

                    return [
                      Tr(
                        isMultiple
                          ? T.RecoverSeveralOneKsClusters
                          : T.RecoverOneKsCluster
                      ),
                      !isMultiple && `#${ID} ${NAME}`,
                    ]
                      .filter(Boolean)
                      .join(' - ')
                  },
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => recover({ id })))
                  setSelectedRows && setSelectedRows([])
                },
              },
            ],
          },
          {
            accessor: ONEKS_ACTIONS.DELETE,
            tooltip: T.Delete,
            icon: Trash,
            selected: { min: 1 },
            importance: STYLE_BUTTONS.IMPORTANCE.DANGER,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            dataCy: `oneks_${ONEKS_ACTIONS.DELETE}`,
            options: [
              {
                dialogProps: {
                  dataCy: `modal-${ONEKS_ACTIONS.DELETE}`,
                  title: (rows) => {
                    const isMultiple = rows?.length > 1
                    const { ID, NAME } = rows?.[0]?.original ?? {}

                    return [
                      Tr(
                        isMultiple
                          ? T.DeleteSeveralVirtualRouters
                          : T.DeleteVirtualRouter
                      ),
                      !isMultiple && `#${ID} ${NAME}`,
                    ]
                      .filter(Boolean)
                      .join(' - ')
                  },
                },
                form: () => DeleteOneKsClusterForm(),
                onSubmit: (rows) => async (template) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => remove({ id, template })))
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
