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
import {
  Button,
  StatusTag,
  TablePanel as SelectionTable,
} from '@ComponentsV2Module'
import { STYLE_BUTTONS, T } from '@ConstantsModule'
import { ArrowRight, Cancel as CloseIcon } from 'iconoir-react'
import { getMarketplaceState } from '@ModelsModule'
import { getTotalOfResources } from '@UtilsModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @returns {Component} - Marketplace aggregated selection tab
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
    {
      id: 'state',
      header: T.State,
      cell: ({ row }) => {
        const { color, name } = getMarketplaceState(row.original) ?? {}

        return <StatusTag statusColor={color} statusName={name} />
      },
    },
    { accessorKey: 'MARKET_MAD', header: T.Driver },
    {
      id: 'apps',
      header: T.Apps,
      cell: ({ row }) => getTotalOfResources(row.original?.MARKETPLACEAPPS),
    },
    { accessorKey: 'ZONE_ID', header: T.Zone },
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
      key="selected-marketplaces-table"
      columns={selectionColumns}
      data={selected}
    />
  )
}

Selection.propTypes = {
  data: PropTypes.object,
}

Selection.id = 'info'
Selection.title = T.Selected
