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
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'

import { List } from 'client/components/Tabs/Common'

import {
  T,
  Ticket,
  TICKET_FIELDS,
  SEVERITIES,
  CATEGORIES,
  RESOLUTIONS,
  PRIORITIES,
} from 'client/constants'
import { getState } from 'client/models/Support'
import { StatusCircle, StatusChip } from 'client/components/Status'
import {
  isoDateToMilliseconds,
  timeFromMilliseconds,
} from 'client/models/Helper'
import Timer from 'client/components/Timer'

const FIELDS_VALUES = {
  391197: (value) => SEVERITIES[value],
  391130: (value) => value,
  391131: (value) => CATEGORIES[value],
  391161: (value) => RESOLUTIONS[value],
}

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {Ticket} props.ticket - Virtual machine
 * @param {string[]} props.actions - Available actions to information tab
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ ticket = undefined, actions }) => {
  if (!ticket) return null

  const { priority, fields, created_at: createdAt } = ticket
  const { name: stateName, color: stateColor } = getState(ticket)
  const [time, timeFormat] = useMemo(() => {
    const fromMill = timeFromMilliseconds(isoDateToMilliseconds(createdAt))

    return [fromMill, fromMill.toFormat('ff')]
  }, [createdAt])

  const fieldsData = Object.entries(fields).map(([_, field]) => ({
    name: TICKET_FIELDS[field.id],
    value: FIELDS_VALUES[field.id](field.value),
    dataCy: TICKET_FIELDS[field.id].toLowerCase(),
  }))

  const info = [
    {
      name: T.State,
      value: (
        <Stack direction="row" alignItems="center" gap={1}>
          <StatusCircle color={stateColor} />
          <StatusChip dataCy="state" text={stateName} stateColor={stateColor} />
        </Stack>
      ),
    },
    ...fieldsData,
    {
      name: T.Priority,
      value: PRIORITIES[priority],
      dataCy: 'priority',
    },
    {
      name: T.Created,
      value: (
        <span title={timeFormat}>
          <Timer initial={time} />
        </span>
      ),
    },
  ].filter(Boolean)

  return (
    <List
      title={T.Information}
      list={info}
      containerProps={{ sx: { gridRow: 'span 3' } }}
    />
  )
}

InformationPanel.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  ticket: PropTypes.shape({}),
}

InformationPanel.displayName = 'InformationPanel'

export default InformationPanel
