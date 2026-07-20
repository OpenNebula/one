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
import { Component } from 'react'
import { TablePanel as SelectionTable, Button } from '@ComponentsV2Module'
import { T, STYLE_BUTTONS } from '@ConstantsModule'
import { getTotalOfResources } from '@UtilsModule'
import { Cancel as CloseIcon, ArrowRight } from 'iconoir-react'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - Security Groups aggregated info tab
 */
export const Selection = ({ data, config }) => {
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
          onClick={() => handleDeselect(row.original.ID)}
        />
      ),
    },
    { accessorKey: 'NAME', header: T.Name, truncate: true },
    {
      accessorKey: 'UPDATED_VMS',
      header: T.TotalUpdatedVms,
      accessorFn: (row) => getTotalOfResources(row?.UPDATED_VMS),
    },
    {
      accessorKey: 'OUTDATED_VMS',
      header: T.TotalOutdatedVms,
      accessorFn: (row) => getTotalOfResources(row?.OUTDATED_VMS),
    },
    {
      accessorKey: 'ERROR_VMS',
      header: T.TotalErrorVms,
      accessorFn: (row) => getTotalOfResources(row?.ERROR_VMS),
    },
    {
      accessorKey: 'TEMPLATE.RULE',
      header: T.TotalRules,
      accessorFn: (row) => row?.TEMPLATE?.RULE?.length || 0,
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
  ]?.filter(Boolean)

  return (
    <SelectionTable
      key="selected-secgroups-table"
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
