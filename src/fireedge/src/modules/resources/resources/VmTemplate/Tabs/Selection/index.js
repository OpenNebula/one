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
import { Box } from '@mui/material'
import {
  TablePanel as SelectionTable,
  Button,
  Image,
} from '@ComponentsV2Module'
import {
  T,
  UNITS,
  STYLE_BUTTONS,
  STATIC_FILES_URL,
  DEFAULT_TEMPLATE_LOGO,
} from '@ConstantsModule'
import { Cancel as CloseIcon, ArrowRight } from 'iconoir-react'
import { getLockIcon, prettyBytes } from '@UtilsModule'
import { scale } from '@StylesModule'
import {
  getVmTemplateImageCount,
  getVmTemplateNetworkCount,
} from '@ModelsModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - VM Templates aggregated info tab
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
    {
      accessorKey: 'NAME',
      header: T.Name,
      truncate: true,
      cell: ({ row }) => {
        const logo = row.original?.TEMPLATE?.LOGO ?? DEFAULT_TEMPLATE_LOGO

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Image
              src={`${STATIC_FILES_URL}/${logo}`}
              width={scale[600]}
              height={scale[600]}
              alt="list-image-identifier"
            />
            <span>{row.original?.NAME}</span>
            {getLockIcon(row.original)}
          </Box>
        )
      },
    },
    {
      accessorKey: 'TEMPLATE.CPU',
      header: T.CPU,
      cell: ({ row }) => row.original.TEMPLATE?.CPU ?? 1,
    },
    {
      accessorKey: 'TEMPLATE.MEMORY',
      header: T.Memory,
      cell: ({ row }) => prettyBytes(row.original.TEMPLATE?.MEMORY, UNITS.MB),
    },
    {
      header: T.Images,
      id: 'images',
      accessorFn: (row) => getVmTemplateImageCount(row),
    },
    {
      header: T.Networks,
      id: 'networks',
      accessorFn: (row) => getVmTemplateNetworkCount(row),
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
      key="selected-vmtemplates-table"
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
