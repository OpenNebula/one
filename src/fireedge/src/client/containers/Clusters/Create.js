/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement } from 'react'
import { useHistory, useLocation } from 'react-router'

import { useGeneralApi } from 'client/features/General'
import {
  useAllocateClusterMutation,
  useGetClusterQuery,
  useAddHostToClusterMutation,
  useAddDatastoreToClusterMutation,
  useAddNetworkToClusterMutation,
  useRemoveHostFromClusterMutation,
  useRemoveDatastoreFromClusterMutation,
  useRemoveNetworkFromClusterMutation,
  useRenameClusterMutation,
} from 'client/features/OneApi/cluster'

import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from 'client/components/FormStepper'
import { CreateForm } from 'client/components/Forms/Cluster'
import { PATH } from 'client/apps/sunstone/routesOne'

import systemApi from 'client/features/OneApi/system'
import { T } from 'client/constants'

/**
 * Displays the creation form for a cluster.
 *
 * @returns {ReactElement} - The cluster form component
 */
function CreateCluster() {
  const history = useHistory()
  const { state: { ID: clusterId } = {} } = useLocation()

  const { enqueueSuccess, enqueueError } = useGeneralApi()
  const [createCluster] = useAllocateClusterMutation()
  const [addHost] = useAddHostToClusterMutation()
  const [addDatastore] = useAddDatastoreToClusterMutation()
  const [addVnet] = useAddNetworkToClusterMutation()
  const [removeHost] = useRemoveHostFromClusterMutation()
  const [removeDatastore] = useRemoveDatastoreFromClusterMutation()
  const [removeVnet] = useRemoveNetworkFromClusterMutation()
  const [rename] = useRenameClusterMutation()

  const { data: version } = systemApi.useGetOneVersionQuery()

  const { data: cluster } = clusterId
    ? useGetClusterQuery({ id: clusterId })
    : { data: undefined }

  const onSubmit = async ({
    general,
    hosts,
    addHosts,
    removeHosts,
    vnets,
    addVnets,
    removeVnets,
    datastores,
    addDatastores,
    removeDatastores,
    changeName,
  }) => {
    try {
      // Request to create a cluster but not to update
      if (!clusterId) {
        // Create cluster
        const newClusterId = await createCluster({
          name: general?.NAME,
        }).unwrap()

        // Add hosts
        if (newClusterId && hosts?.ID) {
          const hostIds = hosts?.ID?.map?.((host) => host)
          await Promise.all(
            hostIds.map((hostId) => addHost({ id: newClusterId, host: hostId }))
          )
        }

        // Add vnets
        if (newClusterId && vnets?.ID) {
          const vnetIds = vnets?.ID?.map?.((vnet) => vnet)
          await Promise.all(
            vnetIds.map((vnetId) => addVnet({ id: newClusterId, vnet: vnetId }))
          )
        }

        // Add datastores
        if (newClusterId && datastores?.ID) {
          const datastoreIds = datastores?.ID?.map?.((ds) => ds)
          await Promise.all(
            datastoreIds.map((dsId) =>
              addDatastore({ id: newClusterId, datastore: dsId })
            )
          )
        }

        // Only show cluster message
        enqueueSuccess(T.SuccessClusterCreated, newClusterId)

        // Go to clusters list
        history.push(PATH.INFRASTRUCTURE.CLUSTERS.LIST)
      } else {
        // Add hosts
        if (addHosts?.length > 0) {
          const hostIds = addHosts?.map?.((host) => host)
          await Promise.all(
            hostIds.map((hostId) => addHost({ id: clusterId, host: hostId }))
          )
        }

        // Remove hosts
        if (removeHosts?.length > 0) {
          const hostIds = removeHosts?.map?.((host) => host)
          await Promise.all(
            hostIds.map((hostId) => removeHost({ id: clusterId, host: hostId }))
          )
        }

        // Add vnets
        if (addVnets?.length > 0) {
          const vnetIds = addVnets?.map?.((vnet) => vnet)
          await Promise.all(
            vnetIds.map((vnetId) => addVnet({ id: clusterId, vnet: vnetId }))
          )
        }

        // Remove vnets
        if (removeVnets?.length > 0) {
          const vnetIds = removeVnets?.map?.((vnet) => vnet)
          await Promise.all(
            vnetIds.map((vnetId) => removeVnet({ id: clusterId, vnet: vnetId }))
          )
        }

        // Add datastores
        if (addDatastores?.length > 0) {
          const datastoreIds = addDatastores?.map?.((ds) => ds)
          await Promise.all(
            datastoreIds.map((dsId) =>
              addDatastore({ id: clusterId, datastore: dsId })
            )
          )
        }

        // Remove datastores
        if (removeDatastores?.length > 0) {
          const datastoreIds = removeDatastores?.map?.((ds) => ds)
          await Promise.all(
            datastoreIds.map((dsId) =>
              removeDatastore({ id: clusterId, datastore: dsId })
            )
          )
        }

        // Rename if the name has been changed
        if (changeName) {
          await rename({ id: clusterId, name: general?.NAME }).unwrap()
        }

        // Only show cluster message
        enqueueSuccess(T.SuccessClusterUpdated, clusterId)

        // Go to clusters list
        history.push(PATH.INFRASTRUCTURE.CLUSTERS.LIST)
      }
    } catch (error) {
      enqueueError(T.ErrorClusterOperation)
    }
  }

  return version && (!clusterId || (clusterId && cluster)) ? (
    <CreateForm
      initialValues={cluster}
      onSubmit={onSubmit}
      stepProps={{
        version,
      }}
      fallback={<SkeletonStepsForm />}
    >
      {(config) => <DefaultFormStepper {...config} />}
    </CreateForm>
  ) : (
    <SkeletonStepsForm />
  )
}

export default CreateCluster
