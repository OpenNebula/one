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
import { generatePath, useHistory } from 'react-router-dom'

import { Box } from '@mui/material'

import { PciProfileSelector, Table } from '@ComponentsV2Module'
import {
  CLUSTER_CLOUD_OPERATIONS,
  PATH,
  RESOURCE_NAMES,
  T,
} from '@ConstantsModule'
import {
  ClusterAPI,
  HostAPI,
  ProvisionAPI,
  useGeneralApi,
} from '@FeaturesModule'
import { hostSelectionTable } from '@ModelsModule'
import { getActionsAvailable } from '@UtilsModule'
import {
  AddHost,
  DeleteHost,
} from '@modules/resources/resources/Cluster/Tabs/Hosts/Action'
import { getStyles } from '@modules/resources/resources/Cluster/Tabs/Hosts/styles'

/**
 * @param {*} value - Resource ids
 * @returns {string[]} Resource ids
 */
const getResourceIds = (value) =>
  [value ?? []].flat().filter(Boolean).map(String)

/**
 * @param {object} dataProvision - Provision data
 * @returns {object[]} Provision address ranges
 */
const getAddressRanges = (dataProvision = {}) =>
  []
    .concat(
      dataProvision?.TEMPLATE?.PROVISION_BODY?.one_objects?.networks ?? []
    )
    .filter((network) => network?.template?.netrole !== 'public')
    .flatMap((network) => network?.template?.ar ?? [])
    .map(
      (ar) =>
        Object.fromEntries(
          Object.entries(ar).map(([key, value]) => [key.toUpperCase(), value])
        ) ?? []
    )

/**
 * Cluster hosts tab.
 *
 * @param {object} root0 - Params
 * @param {object} root0.data - Cluster tab data
 * @param {object} root0.config - Cluster hosts tab configuration
 * @returns {Component} Cluster hosts tab
 */
export const Hosts = ({ data, config }) => {
  const { selected: cluster = {} } = data
  const { enqueueSuccess } = useGeneralApi()
  const history = useHistory()

  const [updateCluster] = ClusterAPI.useUpdateClusterMutation()
  const { data: hosts = [], isFetching } = HostAPI.useGetHostsQuery()
  const [scaleProvisionHosts] = ProvisionAPI.useScaleProvisionHostsMutation()

  const provisionID = cluster?.TEMPLATE?.ONEFORM?.PROVISION_ID
  const { data: dataProvision = {} } = ProvisionAPI.useGetProvisionQuery(
    { id: provisionID, extended: true },
    { skip: !provisionID }
  )

  const actionsAvailable = useMemo(
    () => getActionsAvailable(config?.provision?.actions),
    [config]
  )

  const operations = useMemo(
    () => dataProvision?.TEMPLATE?.PROVISION_BODY?.fireedge?.operations ?? {},
    [dataProvision]
  )

  const ars = useMemo(() => getAddressRanges(dataProvision), [dataProvision])

  const hostIds = useMemo(() => getResourceIds(cluster?.HOSTS?.ID), [cluster])

  const clusterHosts = useMemo(
    () =>
      []
        .concat(hosts ?? [])
        .filter((host) => hostIds.includes(String(host?.ID))),
    [hosts, hostIds]
  )

  const filterHostsIncluded = (dataToFilter) =>
    dataToFilter.filter((host) => hostIds.includes(String(host?.ID)))

  const handleAddHost = async (nodes) => {
    if (!nodes) return

    await scaleProvisionHosts({ id: provisionID, nodes, direction: 'up' })

    history.push(
      generatePath(PATH.INFRASTRUCTURE.CLUSTERS.CREATE_CLOUD_LOGS, {
        id: provisionID,
      }),
      {
        operation: CLUSTER_CLOUD_OPERATIONS.ADDHOST.name,
      }
    )

    enqueueSuccess(T.AddHostProvisionSuccess)
  }

  const handleDeleteHost = async (nodes) => {
    if (!nodes) return

    await scaleProvisionHosts({
      id: provisionID,
      nodes,
      direction: 'down',
    })

    history.push(
      generatePath(PATH.INFRASTRUCTURE.CLUSTERS.CREATE_CLOUD_LOGS, {
        id: provisionID,
      }),
      {
        operation: CLUSTER_CLOUD_OPERATIONS.DELETEHOST.name,
      }
    )

    enqueueSuccess(T.DeleteHostProvisionSuccess)
  }

  const columns = useMemo(() => hostSelectionTable.columns(), [])

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="hosts-profile-selector">
        <PciProfileSelector
          id={cluster?.ID}
          host={clusterHosts}
          update={updateCluster}
          resource={cluster}
        />
      </Box>
      <Box className="hosts-table-container">
        <Box className="hosts-actions">
          {actionsAvailable?.includes?.('add') && operations?.['add-host'] && (
            <AddHost
              formType={operations['add-host']}
              ars={ars}
              submit={handleAddHost}
            />
          )}
          {actionsAvailable?.includes?.('delete') &&
            operations?.['del-host'] && (
              <DeleteHost
                formType={operations['del-host']}
                filter={filterHostsIncluded}
                submit={handleDeleteHost}
              />
            )}
        </Box>
        <Table
          dataCy={hostSelectionTable.dataCy}
          columns={columns}
          data={clusterHosts}
          isRowsSelectable={false}
          isLoading={isFetching}
          openRowDetailsOnClick
          rowDetailsResourceId={RESOURCE_NAMES.HOST}
        />
      </Box>
    </Box>
  )
}

Hosts.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Hosts.id = 'host'
Hosts.title = T.Hosts
