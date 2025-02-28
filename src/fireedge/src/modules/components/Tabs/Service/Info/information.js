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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'

import { List } from '@modules/components/Tabs/Common'
import { StatusCircle, StatusChip } from '@modules/components/Status'
import { getServiceState, timeToString, booleanToString } from '@ModelsModule'
import { T, Service, VM_TEMPLATE_ACTIONS } from '@ConstantsModule'
import { ServiceAPI } from '@FeaturesModule'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {Service} props.service - Service
 * @param {string[]} props.actions - Available actions to information tab
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ service = {}, actions }) => {
  const [addServiceAction] = ServiceAPI.useServiceAddActionMutation()
  const {
    ID,
    NAME,
    TEMPLATE: {
      BODY: {
        deployment,
        shutdown_action: shutdownAction,
        registration_time: regTime,
        ready_status_gate: readyStatusGate,
        automatic_deletion: autoDelete,
      } = {},
    },
  } = service || {}

  const handleRename = async (_, newName) => {
    await renameTemplate({ id: ID, name: newName })
  }

  const renameTemplate = ({ id, name }) => {
    addServiceAction({
      id: id,
      perform: 'rename',
      params: { name },
    })
  }

  const { name: stateName, color: stateColor } = getServiceState(service)

  const info = [
    { name: T.ID, value: ID, dataCy: 'id' },
    {
      name: T.Name,
      value: NAME,
      canEdit: actions?.includes(VM_TEMPLATE_ACTIONS.RENAME),
      dataCy: 'name',
      handleEdit: handleRename,
    },
    {
      name: T.State,
      value: (
        <Stack direction="row" alignItems="center" gap={1}>
          <StatusCircle color={stateColor} />
          <StatusChip dataCy="state" text={stateName} stateColor={stateColor} />
        </Stack>
      ),
    },
    {
      name: T.StartTime,
      value: timeToString(regTime),
      dataCy: 'time',
    },
    {
      name: T.Strategy,
      value: deployment,
      dataCy: 'deployment',
    },
    {
      name: T.ShutdownAction,
      value: shutdownAction,
      dataCy: 'shutdown-action',
    },
    {
      name: T.ReadyStatusGate,
      value: booleanToString(readyStatusGate),
      dataCy: 'ready-status-gate',
    },
    {
      name: T.AutomaticDeletion,
      value: booleanToString(autoDelete),
      dataCy: 'auto-delete',
    },
  ].filter(Boolean)

  return (
    <List
      title={T.Information}
      list={info}
      containerProps={{ sx: { gridRow: 'span 2' } }}
    />
  )
}

InformationPanel.displayName = 'InformationPanel'

InformationPanel.propTypes = {
  service: PropTypes.object,
  actions: PropTypes.arrayOf(PropTypes.string),
}

export default InformationPanel
