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
import { useMemo } from 'react'

import {
  DRIVER_ACTIONS,
  RESOURCE_NAMES,
  STATES,
  STYLE_BUTTONS,
  T,
} from '@ConstantsModule'
import { DriverAPI, useViews } from '@FeaturesModule'
import { Translate } from '@modules/components/HOC'
import {
  createActions,
  GlobalAction,
} from '@modules/components/Tables/Enhanced/Utils'

/**
 * Check if the action should be disabled.
 *
 * @param {object} action - Action to check
 * @returns {boolean} - If the action should be disabled
 */
const isDisabled = (action) => (rows) =>
  rows.map(({ original }) => original).every(({ state }) => state === action)

/**
 * List all the driver names.
 *
 * @param {object} param - Properties
 * @param {Array} param.rows - List of drivers
 * @returns {Array} - List of drivers
 */
const ListDriverNames = ({ rows = [] }) =>
  rows?.map?.(({ id, original }) => {
    const { name } = original

    return (
      <Typography
        key={`file-${id}`}
        variant="inherit"
        component="span"
        display="block"
      >
        {`${name}`}
      </Typography>
    )
  })

const MessageToConfirmActionStyled = (rows) => (
  <>
    <ListDriverNames rows={rows} />
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
 * @returns {GlobalAction} - Actions
 */
const Actions = () => {
  const { view, getResourceView } = useViews()

  const [enable] = DriverAPI.useEnableDriverMutation()
  const [disable] = DriverAPI.useDisableDriverMutation()
  const [sync] = DriverAPI.useSyncDriversMutation()

  const driverActions = useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.DRIVER)?.actions,
        actions: [
          {
            accessor: DRIVER_ACTIONS.SYNC,
            dataCy: `driver_${DRIVER_ACTIONS.SYNC}`,
            tooltip: T.Synchronize,
            label: T.Synchronize,
            importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.FILLED,
            selected: false,
            disabled: (rows) => rows.length > 0,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Synchronize,
                  dataCy: `modal_driver_${DRIVER_ACTIONS.SYNC}`,
                  children: MessageToConfirmActionStyled,
                },
                onSubmit: () => async () => sync(),
              },
            ],
          },
          {
            accessor: DRIVER_ACTIONS.ENABLE,
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            dataCy: `driver_${DRIVER_ACTIONS.ENABLE}`,
            label: T.Enable,
            disabled: isDisabled(STATES.ENABLED),
            tooltip: T.Enable,
            selected: true,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Enable,
                  dataCy: `modal_driver_${DRIVER_ACTIONS.ENABLE}`,
                  children: MessageToConfirmActionStyled,
                },
                onSubmit: (rows) => async () => {
                  const names = rows?.map?.(({ original }) => original?.name)
                  await Promise.all(
                    names.map((name) => enable({ name: name?.toLowerCase() }))
                  )
                },
              },
            ],
          },
          {
            accessor: DRIVER_ACTIONS.DISABLE,
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
            dataCy: `driver_${DRIVER_ACTIONS.DISABLE}`,
            label: T.Disable,
            disabled: isDisabled(STATES.DISABLED),
            tooltip: T.Disable,
            selected: true,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Disable,
                  dataCy: `modal_driver_${DRIVER_ACTIONS.DISABLE}`,
                  children: MessageToConfirmActionStyled,
                },
                onSubmit: (rows) => async () => {
                  const names = rows?.map?.(({ original }) => original?.name)
                  await Promise.all(
                    names.map((name) => disable({ name: name?.toLowerCase() }))
                  )
                },
              },
            ],
          },
        ],
      }),
    [view]
  )

  return driverActions
}

export default Actions
