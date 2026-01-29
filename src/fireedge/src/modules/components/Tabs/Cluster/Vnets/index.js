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
import { ClusterAPI, ProvisionAPI, useGeneralApi, VnAPI } from '@FeaturesModule'
import { getActionsAvailable } from '@ModelsModule'
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'
import { VnsTable } from '@modules/components/Tables'
import { useHistory, generatePath } from 'react-router-dom'
import { PATH } from '@modules/components/path'
import {
  AddIps,
  DeleteIps,
} from '@modules/components/Tabs/Cluster/Vnets/Actions'
import { isEmpty, find } from 'lodash'

/**
 * Renders vnets tab showing the vnets of the cluster.
 *
 * @param {object} props - Props
 * @param {string} props.id - Cluster id
 * @param {object} props.tabProps - Tab props
 * @param {object} props.tabProps.provision - Provision panel info
 * @param {object} props.oneConfig - OpenNebula config
 * @param {boolean} props.adminGroup - If the user is admin
 * @returns {ReactElement} Vnets tab
 */
const Vnets = ({
  tabProps: { provision: provisionPanel } = {},
  id,
  oneConfig,
  adminGroup,
}) => {
  const actionsAvailable = getActionsAvailable(provisionPanel?.actions)
  const { enqueueSuccess } = useGeneralApi()

  // Get info about the cluster
  const { data: cluster, refetch: refetchCluster } =
    ClusterAPI.useGetClusterQuery({ id })

  // Get info about the provision
  const provisionID = cluster?.TEMPLATE?.ONEFORM?.PROVISION_ID
  const { data: dataProvision = {}, refetch: refetchProvision } = provisionID
    ? ProvisionAPI.useGetProvisionQuery({
        id: provisionID,
        extended: true,
      })
    : { data: {}, refetch: () => undefined }

  // Get vnets of the cluster
  const provisionVnets =
    dataProvision?.TEMPLATE?.PROVISION_BODY?.one_objects?.networks
  const vnets = isEmpty(provisionVnets)
    ? []
    : Array.isArray(provisionVnets)
    ? provisionVnets
    : [provisionVnets]

  // Get public vnet (the one that has vn_mad equal to elastic)
  const publicVnet = find(vnets, (v) => v.template?.vn_mad === 'elastic')
  const { data: dataPublicVnet, refetch: refetchVnet } =
    VnAPI.useGetVNetworkQuery({ id: publicVnet?.id }, { skip: !publicVnet })

  // Refresh
  const refetchAll = () => {
    refetchProvision()
    refetchCluster()
    refetchVnet()
  }

  // API actions
  const [addIpsProvision] = ProvisionAPI.useAddIpsProvisionMutation()
  const [deleteIpsProvision] = ProvisionAPI.useDeleteIpsProvisionMutation()

  // Geta avaliable operations
  const operations = useMemo(
    () => dataProvision?.TEMPLATE?.PROVISION_BODY?.fireedge?.operations ?? {},
    [cluster, dataProvision]
  )

  // Define function to get details of a vnet
  const history = useHistory()
  const handleRowClick = (rowId) => {
    history.push(generatePath(PATH.NETWORK.VNETS.DETAIL, { id: String(rowId) }))
  }

  // Add ips to the cluster
  const handleAddIp = async (ipsAmount) => {
    // Exit if there is not ips amount
    if (!ipsAmount) return

    // Request to add ips
    await addIpsProvision({ id: provisionID, amount: ipsAmount })

    // Refresh
    refetchAll()

    // Success message
    enqueueSuccess(T.AddIpsProvisionSuccess)
  }

  // Delete ip from the cluster
  const handleDeleteIp = async ({ arId }) => {
    // Exit if there is not address range id
    if (!arId) return

    // Request to add ips
    await deleteIpsProvision({ id: provisionID, ar_id: arId })

    // Refresh
    refetchAll()

    // Success message
    enqueueSuccess(T.DeleteIpsProvisionSuccess)
  }

  return (
    <Stack direction="column" gap="10px">
      <Stack direction="row" gap="5px">
        {actionsAvailable?.includes?.('add') && operations?.['add-ip'] && (
          <AddIps formType={operations['add-ip']} submit={handleAddIp} />
        )}
        {actionsAvailable?.includes?.('delete') && operations?.['del-ip'] && (
          <DeleteIps
            vnet={dataPublicVnet}
            oneConfig={oneConfig}
            adminGroup={adminGroup}
            actions={provisionPanel?.actions}
            submit={handleDeleteIp}
          />
        )}
      </Stack>

      <VnsTable.Table
        disableRowSelect
        {...(provisionID && {
          filter: (dataToFilter) =>
            dataToFilter.filter((vnet) =>
              vnets.some((net) => String(net.id) === vnet.ID)
            ),
        })}
        onRowClick={(row) => handleRowClick(row.ID)}
      />
    </Stack>
  )
}

Vnets.propTypes = {
  id: PropTypes.string,
  tabProps: PropTypes.object,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

Vnets.displayName = 'Vnets'
Vnets.label = 'VNet'

export default Vnets
