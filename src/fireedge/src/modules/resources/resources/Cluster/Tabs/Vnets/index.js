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

import { Box } from '@mui/material'
import { Table } from '@ComponentsV2Module'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { ProvisionAPI, VnAPI, useGeneralApi } from '@FeaturesModule'
import { vnTable } from '@ModelsModule'
import { getActionsAvailable } from '@UtilsModule'
import {
  AddIps,
  DeleteIps,
} from '@modules/resources/resources/Cluster/Tabs/Vnets/Action'

/**
 * @param {object} value - Resource ids
 * @returns {string[]} Resource ids
 */
const getResourceIds = (value) =>
  [value ?? []].flat().filter(Boolean).map(String)

const getList = (value) => [value ?? []].flat().filter(Boolean)

const normalizeTemplateKeys = (data = {}) =>
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key.toUpperCase(), value])
  )

const getProvisionNetworks = (dataProvision = {}) =>
  getList(dataProvision?.TEMPLATE?.PROVISION_BODY?.one_objects?.networks)

const getPublicNetwork = (networks = []) =>
  networks.find((network) => network?.template?.vn_mad === 'elastic')

const getAddressRanges = (dataPublicVnet = {}, publicNetwork = {}) => {
  const addressRanges = getList(dataPublicVnet?.AR_POOL?.AR)

  if (addressRanges.length > 0) return addressRanges

  return getList(publicNetwork?.template?.ar).map(normalizeTemplateKeys)
}

const isPresent = (value) =>
  value !== undefined && value !== null && value !== ''

/**
 * Cluster virtual networks tab.
 *
 * @param {object} root0 - Params
 * @param {object} root0.data - Cluster tab data
 * @param {object} root0.config - Cluster vnets tab configuration
 * @returns {Component} Cluster virtual networks tab
 */
export const Vnets = ({ data, config }) => {
  const { selected: cluster = {}, handleRefresh, isActionsDisabled } = data
  const { enqueueSuccess } = useGeneralApi()

  const { data: vnets = [], isFetching } = VnAPI.useGetVNetworksQuery()
  const [addIpsProvision, { isLoading: isAddingIps }] =
    ProvisionAPI.useAddIpsProvisionMutation()
  const [deleteIpsProvision, { isLoading: isDeletingIps }] =
    ProvisionAPI.useDeleteIpsProvisionMutation()

  const provisionID = cluster?.TEMPLATE?.ONEFORM?.PROVISION_ID
  const hasProvision = isPresent(provisionID)
  const { data: dataProvision = {}, refetch: refetchProvision } =
    ProvisionAPI.useGetProvisionQuery(
      { id: provisionID, extended: true },
      { skip: !hasProvision }
    )

  const provisionNetworks = useMemo(
    () => getProvisionNetworks(dataProvision),
    [dataProvision]
  )
  const publicNetwork = useMemo(
    () => getPublicNetwork(provisionNetworks),
    [provisionNetworks]
  )
  const publicNetworkId = publicNetwork?.id
  const hasPublicNetwork = isPresent(publicNetworkId)
  const { data: dataPublicVnet = {}, refetch: refetchPublicVnet } =
    VnAPI.useGetVNetworkQuery(
      { id: publicNetworkId },
      { skip: !hasPublicNetwork }
    )

  const actionsAvailable = useMemo(
    () => getActionsAvailable(config?.provision?.actions),
    [config]
  )

  const operations = useMemo(
    () => dataProvision?.TEMPLATE?.PROVISION_BODY?.fireedge?.operations ?? {},
    [dataProvision]
  )

  const clusterVnetIds = useMemo(
    () => getResourceIds(cluster?.VNETS?.ID),
    [cluster]
  )

  const provisionVnetIds = useMemo(
    () => getResourceIds(provisionNetworks.map((network) => network?.id)),
    [provisionNetworks]
  )

  const tableVnetIds = provisionVnetIds.length
    ? provisionVnetIds
    : clusterVnetIds

  const addressRanges = useMemo(
    () => getAddressRanges(dataPublicVnet, publicNetwork),
    [dataPublicVnet, publicNetwork]
  )

  const vnetData = useMemo(
    () =>
      []
        .concat(vnets ?? [])
        .filter((vnet) => tableVnetIds.includes(String(vnet?.ID))),
    [vnets, tableVnetIds]
  )

  const columns = useMemo(
    () =>
      vnTable
        .columns()
        .filter(({ id }) => !['owner', 'group', 'labels'].includes(id)),
    []
  )

  const refetchAll = async () => {
    const refreshes = [handleRefresh?.()]

    hasProvision && refreshes.push(refetchProvision?.())
    hasPublicNetwork && refreshes.push(refetchPublicVnet?.())

    await Promise.all(refreshes.filter(Boolean))
  }

  const handleAddIp = async (amount) => {
    if (!amount || !hasProvision) return

    await addIpsProvision({ id: provisionID, amount }).unwrap()
    await refetchAll()
    enqueueSuccess(T.AddIpsProvisionSuccess)
  }

  const handleDeleteIp = async ({ arId }) => {
    if (!arId || !hasProvision) return

    await deleteIpsProvision({ id: provisionID, ar_id: arId }).unwrap()
    await refetchAll()
    enqueueSuccess(T.DeleteIpsProvisionSuccess)
  }

  const canAddPublicIps =
    actionsAvailable?.includes?.('add') && operations?.['add-ip']
  const canDeleteIpRange =
    (actionsAvailable?.includes?.('delete_ar') ||
      actionsAvailable?.includes?.('delete')) &&
    operations?.['del-ip']
  const hasActions = canAddPublicIps || canDeleteIpRange

  return (
    <Box display="flex" flexDirection="column" gap="1em">
      {hasActions && (
        <Box display="flex" justifyContent="flex-start" gap="0.5em">
          {canAddPublicIps && (
            <AddIps
              formType={operations['add-ip']}
              submit={handleAddIp}
              isDisabled={isActionsDisabled || isAddingIps || !hasProvision}
            />
          )}
          {canDeleteIpRange && (
            <DeleteIps
              addressRanges={addressRanges}
              submit={handleDeleteIp}
              isDisabled={isActionsDisabled || isDeletingIps || !hasProvision}
            />
          )}
        </Box>
      )}
      <Table
        dataCy={vnTable.dataCy}
        columns={columns}
        data={vnetData}
        isRowsSelectable={false}
        isLoading={isFetching}
        openRowDetailsOnClick
        rowDetailsResourceId={RESOURCE_NAMES.VNET}
      />
    </Box>
  )
}

Vnets.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Vnets.id = 'vnet'
Vnets.title = T.Vnets
