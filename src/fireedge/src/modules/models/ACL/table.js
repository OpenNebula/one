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
import { ACL_USERS, T } from '@ConstantsModule'
import { createTable, sentenceCase } from '@UtilsModule'
import { AclAPI } from '@FeaturesModule'

/* eslint-disable jsdoc/require-jsdoc */
export const ACL_COLUMNS = [
  {
    header: T['acls.table.filter.string'],
    id: 'STRING',
    accessorKey: 'STRING',
  },
  {
    header: T['acls.table.filter.user.name'],
    id: 'idUserName',
    accessorKey: 'USER.name',
    truncate: true,
  },
  {
    header: T['acls.table.filter.user.type'],
    id: 'idUserType',
    accessorKey: 'USER.type',
  },
  {
    header: T['acls.table.filter.user.id'],
    id: 'idUserId',
    accessorKey: 'USER.id',
    grow: false,
  },
  {
    header: T.Resources,
    id: 'resources',
    accessorKey: 'RESOURCE.resources',
  },
  {
    header: T['acls.table.filter.resources.user.name'],
    id: 'idResourceName',
    accessorKey: 'RESOURCE.identifier.name',
    truncate: true,
  },
  {
    header: T['acls.table.filter.resources.user.type'],
    id: 'idResourceType',
    accessorKey: 'RESOURCE.identifier.type',
  },
  {
    header: T['acls.table.filter.resources.user.id'],
    id: 'idResourceId',
    accessorKey: 'RESOURCE.identifier.id',
    grow: false,
  },
  {
    header: T.Rights,
    id: 'rights',
    accessorKey: 'RIGHTS.rights',
  },
  {
    header: T['acls.table.filter.zone.name'],
    id: 'zoneName',
    accessorKey: 'ZONE.name',
    truncate: true,
  },
  {
    header: T['acls.table.filter.zone.type'],
    id: 'zoneType',
    accessorKey: 'ZONE.type',
  },
  {
    header: T['acls.table.filter.zone.id'],
    id: 'zoneId',
    accessorKey: 'ZONE.id',
    grow: false,
  },
]

export const ACL_LIST_COLUMNS = [
  {
    header: T.ID,
    id: 'ID',
    accessorKey: 'ID',
    grow: false,
  },
  {
    header: T['acls.table.filter.string'],
    id: 'STRING',
    accessorKey: 'STRING',
    truncate: true,
  },
  {
    header: T.AppliesTo,
    id: 'appliesTo',
    truncate: true,
    accessorFn: ({ USER }) =>
      USER?.type ? sentenceCase(`${USER?.type} ${USER?.name ?? ''}`) : '',
  },
  {
    header: T.AffectedResources,
    id: 'affectedResources',
    accessorFn: ({ RESOURCE }) =>
      Array.isArray(RESOURCE?.resources)
        ? sentenceCase(RESOURCE.resources.join(', '))
        : '',
    truncate: true,
  },
  {
    header: T['acls.table.card.resources.owned'],
    id: 'resourceOwner',
    accessorFn: ({ RESOURCE }) =>
      RESOURCE?.identifier
        ? sentenceCase(
            `${
              RESOURCE?.identifier?.type !== ACL_USERS.INDIVIDUAL.type
                ? RESOURCE?.identifier?.type
                : ''
            } ${
              RESOURCE?.identifier?.type !== ACL_USERS.INDIVIDUAL.type
                ? RESOURCE?.identifier?.name
                  ? RESOURCE?.identifier?.name
                  : ''
                : '#' + RESOURCE?.identifier?.id
            }`
          )
        : '',
  },
  {
    header: T.AllowedOperations,
    id: 'allowedOperations',
    accessorFn: ({ RIGHTS }) => sentenceCase(RIGHTS?.string || ''),
  },
  {
    header: T.Zone,
    id: 'zone',
    accessorFn: ({ ZONE }) => ZONE?.name || T.All,
  },
]

const getColumnValue = (row, { accessorFn, accessorKey }) =>
  accessorFn?.(row) ??
  accessorKey?.split('.').reduce((value, key) => value?.[key], row)

/**
 * @param {object} acl - ACL row
 * @returns {string} Searchable ACL text
 */
export const getAclSearchValue = (acl = {}) =>
  ACL_LIST_COLUMNS.map((column) => getColumnValue(acl, column))
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

export const aclTable = createTable(
  ACL_COLUMNS,
  AclAPI.useGetAclsExtendedQuery,
  {
    dataCy: 'acls',
  }
)
