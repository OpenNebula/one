/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { AddCircledOutline, Trash } from 'iconoir-react'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import { useViews } from 'client/features/Auth'
import { useRemoveVDCMutation } from 'client/features/OneApi/vdc'

import {
  createActions,
  GlobalAction,
} from 'client/components/Tables/Enhanced/Utils'

import { PATH } from 'client/apps/sunstone/routesOne'
import { Translate } from 'client/components/HOC'
import { RESOURCE_NAMES, T, VDC_ACTIONS } from 'client/constants'

const ListVDCNames = ({ rows = [] }) =>
  rows?.map?.(({ id, original }) => {
    const { ID, NAME } = original

    return (
      <Typography
        key={`vdc-${id}`}
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
    <ListVDCNames rows={rows} />
    {description && <Translate word={description} />}
    <Translate word={T.DoYouWantProceed} />
  </>
)

MessageToConfirmAction.displayName = 'MessageToConfirmAction'

/**
 * Generates the actions to operate resources on VM Template table.
 *
 * @returns {GlobalAction} - Actions
 */
const Actions = () => {
  const history = useHistory()
  const { view, getResourceView } = useViews()
  const [remove] = useRemoveVDCMutation()

  return useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.VDC)?.actions,
        actions: [
          {
            accessor: VDC_ACTIONS.CREATE_DIALOG,
            tooltip: T.Create,
            icon: AddCircledOutline,
            action: () => history.push(PATH.SYSTEM.VDCS.CREATE),
          },
          {
            accessor: VDC_ACTIONS.UPDATE_DIALOG,
            label: T.Update,
            tooltip: T.Update,
            selected: { max: 1 },
            dataCy: `vdc_${VDC_ACTIONS.UPDATE_DIALOG}`,
            color: 'secondary',
            action: (rows) => {
              const vdcTemplate = rows?.[0]?.original ?? {}
              history.push(PATH.SYSTEM.VDCS.CREATE, vdcTemplate)
            },
          },
          {
            accessor: VDC_ACTIONS.DELETE,
            tooltip: T.Delete,
            icon: Trash,
            color: 'error',
            selected: { min: 1 },
            dataCy: `vdc_${VDC_ACTIONS.DELETE}`,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Delete,
                  dataCy: `modal-${VDC_ACTIONS.DELETE}`,
                  children: MessageToConfirmAction,
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
}

export default Actions
