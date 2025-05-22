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

import { useViews, VdcAPI } from '@FeaturesModule'

import {
  createActions,
  GlobalAction,
} from '@modules/components/Tables/Enhanced/Utils'

import { RESOURCE_NAMES, STYLE_BUTTONS, T, VDC_ACTIONS } from '@ConstantsModule'
import { Translate } from '@modules/components/HOC'
import { PATH } from '@modules/components/path'

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
 * @param {object} props - datatable props
 * @param {Function} props.setSelectedRows - set selected rows
 * @returns {GlobalAction} - Actions
 */
const Actions = (props = {}) => {
  const { setSelectedRows } = props
  const history = useHistory()
  const { view, getResourceView } = useViews()
  const [remove] = VdcAPI.useRemoveVDCMutation()

  return useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.VDC)?.actions,
        actions: [
          {
            accessor: VDC_ACTIONS.CREATE_DIALOG,
            tooltip: T.Create,
            label: T.Create,
            icon: Plus,
            importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.FILLED,
            action: () => history.push(PATH.SYSTEM.VDCS.CREATE),
          },
          {
            accessor: VDC_ACTIONS.UPDATE_DIALOG,
            label: T.Update,
            tooltip: T.Update,
            selected: { max: 1 },
            dataCy: `vdc_${VDC_ACTIONS.UPDATE_DIALOG}`,
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
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
            importance: STYLE_BUTTONS.IMPORTANCE.DANGER,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.OUTLINED,
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
