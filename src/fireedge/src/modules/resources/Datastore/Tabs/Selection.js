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
import {
  Button,
  ProgressBar,
  StatusTag,
  Tag,
  TablePanel as SelectionTable,
} from '@ComponentsV2Module'
import { T, STYLE_BUTTONS } from '@ConstantsModule'
import { Cancel as CloseIcon, ArrowRight } from 'iconoir-react'
import {
  getDatastoreCapacityInfo,
  getDatastoreState,
  getDatastoreType,
} from '@ModelsModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - Datastore aggregated selection tab
 */
export const Selection = ({ data, config }) => {
  const { selected, handleSelect, handleDeselect } = data || {}

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
        },
        {
          header: T.State,
          id: 'state',
          accessorFn: (row) => getDatastoreState(row)?.name,
          cell: ({ row }) => {
            const { color, name } = getDatastoreState(row.original) ?? {}

            return <StatusTag statusColor={color} statusName={name} />
          },
        },
        {
          header: T.Type,
          id: 'type',
          accessorFn: (row) => getDatastoreType(row),
          cell: ({ row }) => {
            const type = getDatastoreType(row.original)

            return type ? <Tag title={type} status="default" /> : '-'
          },
        },
        {
          header: T.Capacity,
          id: 'capacity',
          accessorFn: (row) => getDatastoreCapacityInfo(row)?.percentLabel,
          cell: ({ row }) => {
            const { percentOfUsed, percentLabel } = getDatastoreCapacityInfo(
              row.original
            )

            return (
              <ProgressBar
                value={percentOfUsed}
                label={percentLabel}
                isLabelVisible
              />
            )
          },
        },
        {
          header: T.Clusters,
          id: 'clusters',
          accessorFn: (row) => [row?.CLUSTERS?.ID ?? []].flat().join(', '),
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
      key="selected-datastores-table"
      columns={selectionColumns}
      data={[].concat(selected).filter(Boolean)}
      isRowsSelectable={false}
      isEnableSearchBar={true}
      isEnableSort={true}
      isEnableFilters={true}
    />
  )
}

Selection.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Selection.id = 'info'
Selection.title = T.Selected
