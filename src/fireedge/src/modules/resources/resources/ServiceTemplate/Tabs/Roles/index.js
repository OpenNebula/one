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
import { Image, TablePanel, Tag } from '@ComponentsV2Module'
import {
  DEFAULT_TEMPLATE_LOGO,
  RESOURCE_NAMES,
  STATIC_FILES_URL,
  T,
  UNITS,
} from '@ConstantsModule'
import { prettyBytes } from '@UtilsModule'
import { SERVICETEMPLATES_ROLES_COLUMNS } from '@ModelsModule'
import { Box } from '@mui/material'
import { scale } from '@StylesModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - Service Templates roles info tab
 */
export const Roles = ({ data, config }) => {
  const { vmTemplateIdMap = {}, selected } = data

  const aSelected = [].concat(selected)
  const roles = []
    .concat(aSelected?.[0]?.TEMPLATE?.BODY?.roles ?? [])
    .filter(Boolean)
    .map((role) => {
      const template = vmTemplateIdMap[String(role?.template_id)] ?? {}

      return {
        ...template,
        ...role,
        ID: role?.template_id ?? template?.ID,
      }
    })

  return (
    <TablePanel
      title={T.Roles}
      key="Roles-Tab"
      columns={[
        {
          ...SERVICETEMPLATES_ROLES_COLUMNS?.[0],
          meta: { disableCellTooltip: true },
          cell: ({ row }) =>
            row.original.name ? <Tag title={row.original.name} /> : '-',
        },
        {
          header: T.TemplateID,
          id: 'template_id',
          accessorKey: 'template_id',
          grow: false,
        },
        {
          header: T.Template,
          id: 'template_name',
          truncate: true,
          cell: ({ row }) => {
            const template =
              vmTemplateIdMap[String(row.original.template_id)] ?? {}
            const logo = template?.TEMPLATE?.LOGO ?? DEFAULT_TEMPLATE_LOGO

            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Image
                  src={`${STATIC_FILES_URL}/${logo}`}
                  width={scale[600]}
                  height={scale[600]}
                  alt="list-image-identifier"
                />
                <span>{template?.NAME ?? row.original.template_id}</span>
              </Box>
            )
          },
        },
        {
          header: T.Memory,
          id: 'memory',
          cell: ({ row }) =>
            prettyBytes(
              vmTemplateIdMap[String(row.original.template_id)]?.TEMPLATE
                ?.MEMORY ?? 0,
              UNITS.MB
            ),
        },
        {
          header: T.CPU,
          id: 'cpu',
          cell: ({ row }) =>
            vmTemplateIdMap[String(row.original.template_id)]?.TEMPLATE?.CPU ??
            '-',
        },

        ...SERVICETEMPLATES_ROLES_COLUMNS.slice(1),
      ]}
      data={roles}
      openRowDetailsOnClick
      rowDetailsResourceId={RESOURCE_NAMES.VM_TEMPLATE}
    />
  )
}

Roles.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Roles.id = 'roles'
Roles.title = T.Roles
