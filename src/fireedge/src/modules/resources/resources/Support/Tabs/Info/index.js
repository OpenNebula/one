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

import {
  CATEGORIES,
  PRIORITIES,
  RESOLUTIONS,
  SEVERITIES,
  T,
  TICKET_FIELDS,
} from '@ConstantsModule'
import { Box } from '@mui/material'
import { DetailsCard, StatusTag } from '@ComponentsV2Module'
import { Component, isValidElement } from 'react'
import { getSupportState } from '@ModelsModule'
import { getStyles } from '@modules/resources/resources/Support/Tabs/Info/styles'
import { isoDateToMilliseconds, timeFromMilliseconds } from '@UtilsModule'
import PropTypes from 'prop-types'

const FIELDS_VALUES = {
  391197: (value) => SEVERITIES[value],
  391130: (value) => value,
  391131: (value) => CATEGORIES[value],
  391161: (value) => RESOLUTIONS[value],
}

const getTicketFields = (ticketOrFields = {}) => {
  const fields =
    ticketOrFields?.fields ?? ticketOrFields?.custom_fields ?? ticketOrFields

  return Array.isArray(fields) ? fields : Object.values(fields ?? {})
}

const stringifyValue = (value) => {
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}

const getRenderableValue = (value) => {
  if (isValidElement(value)) return value
  if (value === undefined || value === null || value === '') return '-'
  if (['string', 'number'].includes(typeof value)) return value
  if (typeof value === 'boolean') return value ? T.Yes : T.No

  if (Array.isArray(value)) {
    const values = value
      .map(getRenderableValue)
      .filter((fieldValue) => fieldValue !== '-')

    return values.length ? values.join(', ') : '-'
  }

  if (typeof value === 'object') {
    const nestedValue = value.name ?? value.label ?? value.value

    return nestedValue === undefined
      ? stringifyValue(value)
      : getRenderableValue(nestedValue)
  }

  return String(value)
}

const getFieldOptions = (ticket = {}) =>
  getTicketFields(ticket)
    .map((field) => {
      const name = TICKET_FIELDS[field?.id]
      if (!name) return undefined

      return [
        name,
        getRenderableValue(
          FIELDS_VALUES[field?.id]?.(field?.value) ?? field?.value
        ),
      ]
    })
    .filter(Boolean)

const getCreatedLabel = (createdAt) =>
  createdAt
    ? timeFromMilliseconds(isoDateToMilliseconds(createdAt)).toRelative()
    : '-'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - Support info tab
 */
export const Info = ({ data, config }) => {
  const { selected } = data || {}
  const { information_panel: informationPanel } = config || {}
  const isInformationPanelEnabled = informationPanel?.enabled !== false
  const ticket = selected || {}
  const { priority, created_at: createdAt = ticket?.createdAt } = ticket
  const { color: stateColor = 'default', name: stateName = '-' } =
    ticket?.status ? getSupportState(ticket) ?? {} : {}

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="top-container">
        {isInformationPanelEnabled && (
          <DetailsCard
            title={T.Information}
            options={[
              [
                T.State,
                <StatusTag
                  key="support-state"
                  dataCy="state"
                  statusName={stateName}
                  statusColor={stateColor}
                />,
              ],
              ...getFieldOptions(ticket),
              [
                T.Priority,
                getRenderableValue(PRIORITIES[priority] ?? priority),
              ],
              [T.Created, getCreatedLabel(createdAt)],
            ]}
          />
        )}
      </Box>
    </Box>
  )
}

Info.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Info.id = 'info'
Info.title = T.Info
