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

import { Button, TablePanel as SelectionTable } from '@ComponentsV2Module'
import { RESOURCE_NAMES, STYLE_BUTTONS, T } from '@ConstantsModule'
import { useFunctionalityApi } from '@FeaturesModule'
import { VDC_LIST_COLUMNS } from '@ModelsModule'
import { Clusters } from '@modules/resources/resources/Vdc/Tabs/Clusters'
import { Datastores } from '@modules/resources/resources/Vdc/Tabs/Datastores'
import { Groups } from '@modules/resources/resources/Vdc/Tabs/Groups'
import { Hosts } from '@modules/resources/resources/Vdc/Tabs/Hosts'
import { Info } from '@modules/resources/resources/Vdc/Tabs/Info'
import { Vnets } from '@modules/resources/resources/Vdc/Tabs/Vnets'
import { ArrowRight, Cancel as CloseIcon } from 'iconoir-react'
import PropTypes from 'prop-types'
import { Component } from 'react'
import { useResourceSingleViewContext } from '@ProvidersModule'

/**
 * @param {Function} handleSelect - Handle select
 * @param {Function} handleDeselect - Handle deselect
 * @returns {Array} Selection table columns
 */
const getSelectionColumns = (handleSelect, handleDeselect) => [
  {
    id: 'deselect',
    header: '',
    grow: false,
    cell: ({ row }) => (
      <Button
        type={STYLE_BUTTONS.TYPE.TRANSPARENT}
        size="small"
        iconOnly={<CloseIcon width="16px" height="16px" />}
        onClick={() => handleDeselect?.(row.original.ID)}
      />
    ),
  },
  ...VDC_LIST_COLUMNS.filter(({ id }) => id !== 'labels'),
  {
    id: 'view',
    header: '',
    grow: false,
    cell: ({ row }) => (
      <Button
        type={STYLE_BUTTONS.TYPE.OUTLINE}
        size="small"
        endIcon={<ArrowRight width="16px" height="16px" />}
        onClick={() => handleSelect?.(row.original)}
      >
        {T.View}
      </Button>
    ),
  },
]

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab slot data payload
 * @returns {Component} Aggregated VDC info tab
 */
export const AggregatedInfo = ({ data }) => {
  const { setSelectedItems } = useFunctionalityApi()
  const { openResourceSingleView } = useResourceSingleViewContext()
  const selectedVdcs = Array.isArray(data?.selected)
    ? data.selected.filter(Boolean)
    : []
  const selectedIds = selectedVdcs.map(({ ID }) => String(ID))

  const handleSelect = (resource) => {
    if (openResourceSingleView(RESOURCE_NAMES.VDC, resource)) return

    setSelectedItems([String(resource?.ID)])
  }

  const handleDeselect = (ID) => {
    const id = String(ID)

    setSelectedItems(selectedIds.filter((selectedId) => selectedId !== id))
  }

  return (
    <SelectionTable
      key="selected-vdcs-table"
      columns={getSelectionColumns(handleSelect, handleDeselect)}
      data={selectedVdcs}
    />
  )
}

AggregatedInfo.propTypes = {
  data: PropTypes.shape({
    selected: PropTypes.array,
  }),
}

AggregatedInfo.id = 'info'
AggregatedInfo.title = T.Info

export const Single = [Info, Groups, Clusters, Hosts, Vnets, Datastores]

export const Aggregated = [AggregatedInfo]
