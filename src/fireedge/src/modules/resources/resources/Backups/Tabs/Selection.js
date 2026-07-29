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

import PropTypes from 'prop-types'
import { Component, useMemo } from 'react'
import { Box } from '@mui/material'
import {
  Button,
  StatusTag,
  Tag,
  TablePanel as SelectionTable,
} from '@ComponentsV2Module'
import { STYLE_BUTTONS, T } from '@ConstantsModule'
import { ArrowRight, Cancel as CloseIcon } from 'iconoir-react'
import {
  getBackupRunningVms,
  getImageState,
  getImageTypeLabel,
} from '@ModelsModule'
import { getLockIcon, prettyBytes } from '@UtilsModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @returns {Component} - Backup aggregated selection tab
 */
export const Selection = ({ data }) => {
  const { selected, handleSelect, handleDeselect } = data || {}
  const selectedBackups = useMemo(
    () => [].concat(selected).filter(Boolean),
    [selected]
  )
  const selectionColumns = useMemo(
    () =>
      [
        {
          id: 'deselect',
          header: '',
          grow: false,
          cell: ({ row }) => (
            <Button
              type={STYLE_BUTTONS.TYPE.TRANSPARENT}
              size="small"
              iconOnly={<CloseIcon width={'16px'} height={'16px'} />}
              onClick={() => handleDeselect(row.original.ID)}
            />
          ),
        },
        {
          accessorKey: 'NAME',
          id: 'name',
          header: T.Name,
          truncate: true,
          cell: ({ row }) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{row.original?.NAME}</span>
              {getLockIcon(row.original)}
            </Box>
          ),
        },
        {
          header: T.State,
          id: 'state',
          accessorFn: (row) => getImageState(row)?.name,
          cell: ({ row }) => {
            const { color, name } = getImageState(row.original) ?? {}

            return <StatusTag statusColor={color} statusName={name} />
          },
        },
        {
          header: T.Type,
          id: 'type',
          accessorFn: (row) => getImageTypeLabel(row),
          cell: ({ row }) => {
            const type = getImageTypeLabel(row.original)

            return type ? <Tag title={type} status="default" /> : '-'
          },
        },
        {
          header: T.Size,
          id: 'size',
          accessorFn: (row) => prettyBytes(+row?.SIZE || 0, 'MB'),
          cell: ({ row }) => prettyBytes(+row.original?.SIZE || 0, 'MB'),
        },
        {
          header: T.Persistent,
          id: 'persistent',
          accessorFn: (row) => (+row?.PERSISTENT ? T.Yes : T.No),
          cell: ({ row }) => (+row.original?.PERSISTENT ? T.Yes : T.No),
        },
        {
          header: T.VMs,
          id: 'vms',
          accessorFn: (row) => getBackupRunningVms(row),
        },
        {
          header: T.Datastore,
          id: 'datastore',
          accessorKey: 'DATASTORE',
          truncate: true,
        },
        {
          accessorKey: 'ID',
          header: '',
          grow: false,
          cell: ({ row }) => (
            <Button
              type={STYLE_BUTTONS.TYPE.OUTLINE}
              size="small"
              endIcon={<ArrowRight width={'16px'} height={'16px'} />}
              onClick={() => handleSelect(row.original.ID)}
            >
              {T.View}
            </Button>
          ),
        },
      ].filter(Boolean),
    [handleDeselect, handleSelect]
  )

  return (
    <SelectionTable
      key="selected-backups-table"
      columns={selectionColumns}
      data={selectedBackups}
      isRowsSelectable={false}
      isEnableSearchBar={true}
      isEnableSort={true}
      isEnableFilters={true}
    />
  )
}

Selection.propTypes = {
  data: PropTypes.object,
}

Selection.id = 'info'
Selection.title = T.Selected

export default Selection
