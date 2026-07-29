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
  DetailsDrawer,
  InfoSlot,
  SummarySlot,
  TabSlot,
  Button,
} from '@ComponentsV2Module'
import { Component, useMemo } from 'react'
import { SEVERITIES, STYLE_BUTTONS, T, TICKET_FIELDS } from '@ConstantsModule'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Cancel as CloseIcon } from 'iconoir-react'
import { Support as SupportResource } from '@ResourcesModule'
import { getSupportState } from '@ModelsModule'
import { TOOLBAR_STYLES } from '@modules/containers/Support/Details/styles'

const getTicketFields = (ticketOrFields = {}) => {
  const fields =
    ticketOrFields?.fields ?? ticketOrFields?.custom_fields ?? ticketOrFields

  return Array.isArray(fields) ? fields : Object.values(fields ?? {})
}

const getTicketSeverity = (ticket = {}) => {
  const severityField = getTicketFields(ticket).find(
    ({ id }) => TICKET_FIELDS[id] === T.Severity
  )

  return SEVERITIES[severityField?.value] ?? severityField?.value ?? '-'
}

const getSummary = (values = []) => {
  const counts = values.reduce((acc, value) => {
    const key = value || '-'
    acc[key] = (acc[key] ?? 0) + 1

    return acc
  }, {})

  return Object.entries(counts)
    .map(([value, count]) => `${value}: ${count}`)
    .join(', ')
}

const getCommonValue = (values = []) => {
  const normalizedValues = values.map((value) => value || '-')
  const uniqueValues = new Set(normalizedValues)

  return uniqueValues.size === 1 ? normalizedValues[0] : '-'
}

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {Array} root0.selectedTickets - Selected support tickets
 * @param {Function} root0.handleClose - Handle close
 * @param {Function} root0.handleSelect - Handle select
 * @param {Function} root0.handleDeselect - Handle deselect
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Aggregated support ticket details drawer
 */
export const AggregatedView = ({
  isOpen = false,
  selectedTickets = [],
  handleClose,
  handleSelect,
  handleDeselect,
  actions = [],
}) => {
  const summary = useMemo(
    () => ({
      status: getSummary(
        selectedTickets.map((ticket) => getSupportState(ticket)?.name)
      ),
      severity: getCommonValue(selectedTickets.map(getTicketSeverity)),
    }),
    [selectedTickets]
  )

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: `${selectedTickets?.length} ${T.Support} ${T.Selected}`,
            Toolbar: () => (
              <Box sx={TOOLBAR_STYLES}>
                <Button
                  type={STYLE_BUTTONS.TYPE.TRANSPARENT}
                  size="small"
                  iconOnly={<CloseIcon width={'16px'} height={'16px'} />}
                  onClick={handleClose}
                />
              </Box>
            ),
          },
        ],
        [
          SummarySlot,
          {
            labels: [
              [summary.status || '-', T.Status],
              [summary.severity || '-', T.Severity],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: SupportResource.Tabs.Aggregated,
            resourceId: SupportResource.RID,
            tabProps: {
              selected: selectedTickets,
              handleSelect,
              handleDeselect,
              actions,
            },
          },
        ],
      ]}
    />
  )
}

AggregatedView.displayName = 'AggregatedView'

AggregatedView.propTypes = {
  isOpen: PropTypes.bool,
  selectedTickets: PropTypes.array,
  handleClose: PropTypes.func,
  handleSelect: PropTypes.func,
  handleDeselect: PropTypes.func,
  actions: PropTypes.array,
}
