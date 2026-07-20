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

import { createTable, getTotalOfResources } from '@UtilsModule'
import { ALL_SELECTED, T } from '@ConstantsModule'
import { VdcAPI } from '@FeaturesModule'
import { createLabelColumn } from '@modules/models/labels'

/* eslint-disable jsdoc/require-jsdoc */
const toArray = (value) =>
  []
    .concat(value ?? [])
    .flat()
    .filter((item) => item !== undefined && item !== null && item !== '')

const formatCount = (ids = []) =>
  ids.length === 1 && String(ids[0]) === ALL_SELECTED ? T.All : ids.length

export const getVdcGroupsCount = (vdc = {}) => getTotalOfResources(vdc?.GROUPS)

export const getVdcClustersCount = (vdc = {}) =>
  formatCount(
    toArray(vdc?.CLUSTERS?.CLUSTER).map((cluster) => cluster?.CLUSTER_ID)
  )

export const getVdcHostsCount = (vdc = {}) =>
  formatCount(toArray(vdc?.HOSTS?.HOST).map((host) => host?.HOST_ID))

export const getVdcDatastoresCount = (vdc = {}) =>
  formatCount(
    toArray(vdc?.DATASTORES?.DATASTORE).map(
      (datastore) => datastore?.DATASTORE_ID
    )
  )

export const getVdcVnetsCount = (vdc = {}) =>
  formatCount(toArray(vdc?.VNETS?.VNET).map((vnet) => vnet?.VNET_ID))

export const VDC_COLUMNS = [
  { header: T.ID, accessorKey: 'ID', grow: false },
  { header: T.Name, accessorKey: 'NAME', truncate: true },
  {
    header: T.Groups,
    id: 'GROUPS',
    accessorFn: getVdcGroupsCount,
  },
  {
    header: T.Clusters,
    id: 'CLUSTERS',
    accessorFn: getVdcClustersCount,
  },
  {
    header: T.Hosts,
    id: 'HOSTS',
    accessorFn: getVdcHostsCount,
  },
  {
    header: T.Datastores,
    id: 'DATASTORES',
    accessorFn: getVdcDatastoresCount,
  },
  {
    header: T.Vnets,
    id: 'VNETS',
    accessorFn: getVdcVnetsCount,
  },
  createLabelColumn({ grow: false }),
]

export const VDC_LIST_COLUMNS = [
  { accessorKey: 'ID', header: T.ID, grow: false },
  { accessorKey: 'NAME', header: T.Name, truncate: true },
  {
    id: 'GROUPS',
    header: T.Groups,
    accessorFn: getVdcGroupsCount,
  },
  {
    id: 'CLUSTERS',
    header: T.Clusters,
    accessorFn: getVdcClustersCount,
  },
  { id: 'HOSTS', header: T.Hosts, accessorFn: getVdcHostsCount },
  {
    id: 'DATASTORES',
    header: T.Datastores,
    accessorFn: getVdcDatastoresCount,
  },
  { id: 'VNETS', header: T.Vnets, accessorFn: getVdcVnetsCount },
  createLabelColumn({ grow: false }),
]

export const vdcTable = createTable(VDC_COLUMNS, VdcAPI.useGetVDCsQuery, {
  dataCy: 'vdcs',
})
