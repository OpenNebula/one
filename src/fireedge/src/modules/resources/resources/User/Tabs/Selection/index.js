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
import { Cancel as CloseIcon, ArrowRight } from 'iconoir-react'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @returns {Component} - Users aggregated selection tab
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
          onClick={() => handleDeselect(row.original.ID)}
        />
      ),
    },
    { accessorKey: 'NAME', header: T.Name, truncate: true },
    { accessorKey: 'AUTH_DRIVER', header: T.AuthDriver },
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
  ]

  return (
    <SelectionTable
      key="selected-users-table"
      columns={selectionColumns}
      data={selected}
    />
  )
}

Selection.propTypes = {
  data: PropTypes.object,
}

Selection.id = 'info'
Selection.title = T.Info
