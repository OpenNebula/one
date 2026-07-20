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
import { Button, TablePanel as SelectionTable } from '@ComponentsV2Module'
import { STYLE_BUTTONS, T } from '@ConstantsModule'
import { ArrowRight, Cancel as CloseIcon } from 'iconoir-react'
import { getImageState } from '@ModelsModule'
import { getImageType, getLockIcon } from '@UtilsModule'

const getRunningVms = (file) =>
  file?.RUNNING_VMS ?? [file?.VMS?.ID ?? []].flat().length

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @returns {Component} - File aggregated selection tab
 */
export const Selection = ({ data }) => {
  const { selected, handleSelect, handleDeselect } = data || {}
  const selectedFiles = useMemo(
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
        },
        {
          header: T.Datastore,
          id: 'datastore',
          accessorKey: 'DATASTORE',
        },
        {
          header: T.Type,
          id: 'type',
          accessorFn: (row) => getImageType(row),
        },
        {
          header: T.VMs,
          id: 'vms',
          accessorFn: (row) => getRunningVms(row),
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
      key="selected-files-table"
      columns={selectionColumns}
      data={selectedFiles}
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
