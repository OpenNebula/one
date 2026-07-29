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

import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { ClusterAPI } from '@FeaturesModule'
import { getTotalOfResources } from '@UtilsModule'
import { Component } from 'react'

import {
  getVdcId,
  VdcZoneResourceTab,
  vdcTabPropTypes,
} from '@modules/resources/resources/Vdc/Tabs/common'

const columns = [
  { accessorKey: 'ID', header: T.ID, grow: false },
  { accessorKey: 'NAME', header: T.Name, truncate: true },
  {
    id: 'HOSTS',
    header: T.Hosts,
    accessorFn: (row) => getTotalOfResources(row?.HOSTS),
  },
  {
    id: 'DATASTORES',
    header: T.Datastores,
    accessorFn: (row) => getTotalOfResources(row?.DATASTORES),
  },
  {
    id: 'VNETS',
    header: T.Vnets,
    accessorFn: (row) => getTotalOfResources(row?.VNETS),
  },
  {
    id: 'TYPE',
    header: T.Type,
    accessorFn: (row) => row?.TEMPLATE?.ONEFORM?.DRIVER ?? '-',
  },
]

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab slot data payload
 * @returns {Component} VDC clusters tab
 */
export const Clusters = ({ data }) => (
  <VdcZoneResourceTab
    vdcId={getVdcId(data)}
    title={T.Clusters}
    poolKey="CLUSTERS"
    resourceKey="CLUSTER"
    idKey="CLUSTER_ID"
    columns={columns}
    rowDetailsResourceId={RESOURCE_NAMES.CLUSTER}
    dataCy="vdc-clusters"
    useQuery={ClusterAPI.useGetClustersQuery}
  />
)

Clusters.propTypes = vdcTabPropTypes

Clusters.id = 'clusters'
Clusters.title = T.Clusters
