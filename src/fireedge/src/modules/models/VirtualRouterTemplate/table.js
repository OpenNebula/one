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
  createTable,
  getLockIcon,
  prettyBytes,
  timeFromMilliseconds,
} from '@UtilsModule'
import { VmTemplateAPI } from '@FeaturesModule'
import {
  T,
  UNITS,
  STATIC_FILES_URL,
  DEFAULT_TEMPLATE_LOGO,
} from '@ConstantsModule'
import { Image, Tag } from '@ComponentsV2Module'
import { createLabelColumn } from '@modules/models/labels'
import { Box } from '@mui/material'

/* eslint-disable jsdoc/require-jsdoc */
export const VRTEMPLATE_COLUMNS = [
  {
    accessorKey: 'ID',
    header: T.ID,
    grow: false,
  },
  {
    accessorKey: 'NAME',
    header: T.Name,
    truncate: true,
    cell: ({ row }) => {
      const logo = row?.original?.TEMPLATE?.LOGO ?? DEFAULT_TEMPLATE_LOGO
      const src = `${STATIC_FILES_URL}/${logo}`

      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Image
            src={src}
            width={32}
            height={32}
            alt={'list-image-identifier'}
          />
          <span>{row.original?.NAME}</span>
          {getLockIcon(row.original)}
        </Box>
      )
    },
  },
  {
    header: T.CPU,
    id: 'cpu',
    accessorFn: (row) => row?.TEMPLATE?.CPU ?? 1,
  },
  {
    header: T.Memory,
    id: 'memory',
    accessorFn: (row) => row?.TEMPLATE?.MEMORY,
    cell: ({ row }) => prettyBytes(row.original?.TEMPLATE?.MEMORY, UNITS.MB),
  },
  {
    header: T.Hypervisor,
    id: 'hypervisor',
    accessorFn: (row) => row?.TEMPLATE?.HYPERVISOR,
    cell: ({ row }) => {
      const hypervisor = row.original?.TEMPLATE?.HYPERVISOR

      return hypervisor ? <Tag title={hypervisor} status="default" /> : '-'
    },
  },
  {
    accessorKey: 'UNAME',
    header: T.Owner,
    grow: false,
  },
  {
    accessorKey: 'GNAME',
    header: T.Group,
    grow: false,
  },
  {
    accessorKey: 'REGTIME',
    header: T.RegistrationTime,
    grow: false,
    cell: ({ row }) => timeFromMilliseconds(row.original.REGTIME).toRelative(),
  },
  createLabelColumn({ grow: false }),
]

export const vrtemplateTable = createTable(
  VRTEMPLATE_COLUMNS,
  (args, options) =>
    VmTemplateAPI.useGetTemplatesQuery(args, {
      ...options,
      selectFromResult: ({ data, isFetching, isLoading }) => ({
        data: data?.filter((t) => t?.TEMPLATE?.VROUTER === 'YES'),
        isFetching,
        isLoading,
      }),
    }),
  { dataCy: 'vr-templates' }
)
