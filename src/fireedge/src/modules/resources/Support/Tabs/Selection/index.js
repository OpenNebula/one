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
  Button,
  StatusTag,
  TablePanel as SelectionTable,
} from '@ComponentsV2Module'
import { SEVERITIES, STYLE_BUTTONS, T, TICKET_FIELDS } from '@ConstantsModule'
import { Component } from 'react'
import PropTypes from 'prop-types'
import { ArrowRight, Cancel as CloseIcon } from 'iconoir-react'
import { getSupportState } from '@ModelsModule'

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
 * @param {object} root0.data - Tab specific data
 * @returns {Component} - Support aggregated selection tab
 */
export const Selection = ({ data }) => {
  const { selected, handleSelect, handleDeselect } = data

  const selectionColumns = [
    {
      id: 'deselect',
      header: '',
      grow: false,
      cell: ({ row }) => (
        <Button
          type={STYLE_BUTTONS.TYPE.TRANSPARENT}
          size="small"
          iconOnly={<CloseIcon width={'16px'} height={'16px'} />}
          onClick={() => handleDeselect(row.original.id)}
        />
      ),
    },
    {
      accessorKey: 'id',
      header: T.ID,
      grow: false,
    },
    {
      accessorKey: 'subject',
      header: T.Subject,
      truncate: true,
    },
    {
      id: 'status',
      header: T.Status,
      accessorFn: (row) => getSupportState(row)?.name,
      cell: ({ row }) => {
        const { color, name } = getSupportState(row.original) ?? {}

        return <StatusTag statusColor={color} statusName={name} />
      },
    },
    {
      id: 'severity',
      header: T.Severity,
      accessorFn: getTicketSeverity,
    },
    {
      id: 'view',
      header: '',
      grow: false,
      cell: ({ row }) => (
        <Button
          type={STYLE_BUTTONS.TYPE.OUTLINE}
          size="small"
          endIcon={<ArrowRight width={'16px'} height={'16px'} />}
          onClick={() => handleSelect(row.original.id)}
        >
          {T.View}
        </Button>
      ),
    },
  ]

  return (
    <SelectionTable
      key="selected-support-table"
      columns={selectionColumns}
      data={selected}
    />
  )
}

Selection.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Selection.id = 'info'
Selection.title = T.Selected
