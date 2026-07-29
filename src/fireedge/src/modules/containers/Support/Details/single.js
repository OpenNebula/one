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
  ToggleGroup,
} from '@ComponentsV2Module'
import { Component } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { Cancel, RefreshDouble } from 'iconoir-react'
import { SEVERITIES, T, Ticket, TICKET_FIELDS } from '@ConstantsModule'
import { Support as SupportResource } from '@ResourcesModule'
import { SupportAPI } from '@FeaturesModule'
import { getSupportState } from '@ModelsModule'
import { isoDateToMilliseconds, timeFromMilliseconds } from '@UtilsModule'
import { TOOLBAR_STYLES } from '@modules/containers/Support/Details/styles'

const getTicketFields = (fields = {}) =>
  Array.isArray(fields) ? fields : Object.values(fields)

const getTicketSeverity = (ticket = {}) => {
  const severityField = getTicketFields(ticket?.fields).find(
    ({ id }) => TICKET_FIELDS[id] === T.Severity
  )

  return SEVERITIES[severityField?.value] ?? severityField?.value ?? '-'
}

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {Ticket} root0.selectedTicket - Selected support ticket
 * @param {Function} root0.handleClose - Handle close
 * @param {Function} root0.handleSelect - Handle select
 * @param {Function} root0.handleDeselect - Handle deselect
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Single support ticket details drawer
 */
export const SingleView = ({
  isOpen = false,
  selectedTicket = {},
  handleClose,
  handleSelect,
  handleDeselect,
  actions = [],
}) => {
  const [refreshTickets, { isFetching: isRefreshingTickets }] =
    SupportAPI.useLazyGetTicketsQuery()

  const { id, subject, created_at: createdAt } = selectedTicket
  const {
    data: comments = [],
    isFetching: isRefreshingComments,
    refetch: refreshComments,
  } = SupportAPI.useGetTicketCommentsQuery(
    { id },
    { skip: !isOpen || id === undefined }
  )
  const [updateTicket, { isLoading: isSubmittingComment }] =
    SupportAPI.useUpdateTicketMutation()
  const { name: stateName = '-' } = selectedTicket?.status
    ? getSupportState(selectedTicket) ?? {}
    : {}
  const severity = getTicketSeverity(selectedTicket)
  const createdLabel = createdAt
    ? timeFromMilliseconds(isoDateToMilliseconds(createdAt)).toRelative()
    : '-'

  const isRefreshing = isRefreshingTickets || isRefreshingComments

  const handleRefresh = () => {
    refreshTickets()
    id !== undefined && refreshComments()
  }

  const handleSubmitComment = async (comment) => {
    await updateTicket(comment).unwrap()
    id !== undefined && (await refreshComments())
    refreshTickets()
  }

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: subject,
            id,
            labels: [[T.Created, createdLabel]],
            Toolbar: () => (
              <Box sx={TOOLBAR_STYLES}>
                <ToggleGroup
                  size="medium"
                  options={[
                    [
                      {
                        startIcon: <RefreshDouble width="16px" height="16px" />,
                        onClick: handleRefresh,
                        value: 'refresh',
                        isDisabled: isRefreshing,
                      },
                      {
                        startIcon: <Cancel width="16px" height="16px" />,
                        onClick: handleClose,
                        value: 'close',
                      },
                    ],
                  ]}
                />
              </Box>
            ),
          },
        ],
        [
          SummarySlot,
          {
            labels: [
              [stateName, T.State],
              [severity, T.Severity],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: SupportResource.Tabs.Single,
            resourceId: SupportResource.RID,
            tabProps: {
              selected: selectedTicket,
              comments,
              onSubmitComment: handleSubmitComment,
              isSubmittingComment,
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

SingleView.displayName = 'SingleView'

SingleView.propTypes = {
  isOpen: PropTypes.bool,
  selectedTicket: PropTypes.object,
  handleClose: PropTypes.func,
  handleSelect: PropTypes.func,
  handleDeselect: PropTypes.func,
  actions: PropTypes.array,
}
