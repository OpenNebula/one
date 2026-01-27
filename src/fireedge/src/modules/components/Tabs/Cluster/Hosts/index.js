/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { T } from '@ConstantsModule'
import {
  ClusterAPI,
  HostAPI,
  ProvisionAPI,
  useGeneralApi,
} from '@FeaturesModule'
import { getActionsAvailable } from '@ModelsModule'
import { PATH } from '@modules/components/path'
import { HostsTable } from '@modules/components/Tables'
import { ProfileSelector } from '@modules/components/Tabs/Common/PCI'
import { Box, Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, useMemo } from 'react'
import { generatePath, useHistory } from 'react-router-dom'
import { AddHost, DeleteHost } from './Action'
const _ = require('lodash')

/**
 * Renders hosts tab showing the hosts of the cluster.
 *
 * @param {object} props - Props
 * @param {string} props.id - Cluster id
 * @param {object} props.tabProps - Tab props
 * @param {object} props.tabProps.provision - Provision panel info
 * @returns {ReactElement} Hosts tab
 */
const Hosts = ({ tabProps: { provision: provisionPanel } = {}, id }) => {
  const [update] = ClusterAPI.useUpdateClusterMutation()
  const { enqueueSuccess } = useGeneralApi()
  const actionsAvailable = getActionsAvailable(provisionPanel?.actions)

  // Get info about the cluster
  const { data: cluster, refetch: refetchCluster } =
    ClusterAPI.useGetClusterQuery({ id })
  const { data: hosts = [] } = HostAPI.useGetHostsQuery()
  const provisionID = cluster?.TEMPLATE?.ONEFORM?.PROVISION_ID
  const { data: dataProvision = {}, refetch: refetchProvision } = provisionID
    ? ProvisionAPI.useGetProvisionQuery({ id: provisionID, extended: true })
    : { data: {}, refetch: () => undefined }
  const [scaleProvisionHosts] = ProvisionAPI.useScaleProvisionHostsMutation()

  const refetchAll = () => {
    refetchProvision() && refetchCluster()
  }

  const operations = useMemo(
    () => dataProvision?.TEMPLATE?.PROVISION_BODY?.fireedge?.operations ?? {},
    [cluster, dataProvision]
  )

  const ars = useMemo(
    () =>
      dataProvision?.TEMPLATE?.PROVISION_BODY?.one_objects?.networks
        ?.filter((n) => n?.template?.netrole !== 'public')
        ?.flatMap((n) => n?.template?.ar ?? [])
        ?.map(
          (ar) =>
            Object.fromEntries(
              Object.entries(ar).map(([key, value]) => [
                key.toUpperCase(),
                value,
              ])
            ) ?? []
        ),
    [cluster, dataProvision]
  )

  // Define function to get details of a host
  const history = useHistory()
  const handleRowClick = (rowId) => {
    history.push(
      generatePath(PATH.INFRASTRUCTURE.HOSTS.DETAIL, { id: String(rowId) })
    )
  }

  // Get hosts of the cluster
  const hostIds = _.isEmpty(cluster?.HOSTS)
    ? []
    : Array.isArray(cluster?.HOSTS?.ID)
    ? cluster?.HOSTS?.ID
    : [cluster?.HOSTS?.ID]

  const filterHosts = []
    .concat(hosts)
    ?.filter(({ ID }) => hostIds?.includes(ID))

  const filterHostsIncluded = (dataToFilter) =>
    dataToFilter.filter((host) => _.includes(hostIds, host.ID))

  const handleAddHost = async (data) => {
    if (!data) return
    await scaleProvisionHosts({ id: provisionID, nodes: data, direction: 'up' })
    refetchAll()

    // Success message
    enqueueSuccess(T.AddHostProvisionSuccess)
  }

  const handleDeleteHost = async (data) => {
    if (!data) return
    await scaleProvisionHosts({
      id: provisionID,
      nodes: data,
      direction: 'down',
    })
    refetchAll()

    // Success message
    enqueueSuccess(T.DeleteHostProvisionSuccess)
  }

  return (
    <Box display="grid" gridTemplateColumns="1fr 2fr" gap={1} height="100%">
      <Box
        sx={{
          pr: 1,
          borderRight: '1px solid',
          borderColor: 'divider',
          height: '100%',
        }}
      >
        <ProfileSelector
          id={id}
          host={filterHosts}
          update={update}
          resource={cluster}
        />
      </Box>
      <Box>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="start"
          gap="1rem"
          marginBottom="1rem"
        >
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
        </Stack>
        <HostsTable.Table
          disableRowSelect
          filter={filterHostsIncluded}
          onRowClick={(row) => handleRowClick(row.ID)}
        />
      </Box>
    </Box>
  )
}

Hosts.propTypes = {
  id: PropTypes.string,
  tabProps: PropTypes.object,
}

Hosts.displayName = 'Hosts'

export default Hosts
