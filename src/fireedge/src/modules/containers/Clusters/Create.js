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
import { ReactElement } from 'react'
import { useHistory, useLocation } from 'react-router'

import { ClusterAPI, SystemAPI, useGeneralApi } from '@FeaturesModule'

import {
  DefaultFormStepper,
  Form,
  PATH,
  SkeletonStepsForm,
  TranslateProvider,
} from '@ComponentsModule'
import { T } from '@ConstantsModule'
import { jsonToXml } from '@ModelsModule'

const { Cluster } = Form

/**
 * Displays the creation form for a cluster.
 *
 * @returns {ReactElement} - The cluster form component
 */
export function CreateCluster() {
  const history = useHistory()
  const { state: { ID: clusterId } = {} } = useLocation()

  const { enqueueSuccess, enqueueError } = useGeneralApi()
  const [createCluster] = ClusterAPI.useAllocateClusterMutation()
  const [addHost] = ClusterAPI.useAddHostToClusterMutation()
  const [addDatastore] = ClusterAPI.useAddDatastoreToClusterMutation()
  const [addVnet] = ClusterAPI.useAddNetworkToClusterMutation()
  const [removeHost] = ClusterAPI.useRemoveHostFromClusterMutation()
  const [removeDatastore] = ClusterAPI.useRemoveDatastoreFromClusterMutation()
  const [removeVnet] = ClusterAPI.useRemoveNetworkFromClusterMutation()
  const [rename] = ClusterAPI.useRenameClusterMutation()
  const [update] = ClusterAPI.useUpdateClusterMutation()

  const { data: version } = SystemAPI.useGetOneVersionQuery()

  const { data: cluster } = clusterId
    ? ClusterAPI.useGetClusterQuery({ id: clusterId })
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
      let id = clusterId
      // Request to create a cluster but not to update
      if (!id) {
        // Create cluster
        id = await createCluster({
          name: general?.NAME,
        }).unwrap()

        // Add hosts
        if (id && hosts?.ID) {
          const hostIds = hosts?.ID?.map?.((host) => host)
          await Promise.all(
            hostIds.map((hostId) => addHost({ id, host: hostId }))
          )

          if (hosts.EVC_MODE) {
            await update({
              id,
              template: jsonToXml({ EVC_MODE: hosts.EVC_MODE }),
              replace: 1,
            })
          }
        }

        // Add vnets
        if (id && vnets?.ID) {
          const vnetIds = vnets?.ID?.map?.((vnet) => vnet)
          await Promise.all(
            vnetIds.map((vnetId) => addVnet({ id, vnet: vnetId }))
          )
        }

        // Add datastores
        if (id && datastores?.ID) {
          const datastoreIds = datastores?.ID?.map?.((ds) => ds)
          await Promise.all(
            datastoreIds.map((dsId) => addDatastore({ id, datastore: dsId }))
          )
        }

        // Only show cluster message
        enqueueSuccess(T.SuccessClusterCreated, id)

        // Go to clusters list
        history.push(PATH.INFRASTRUCTURE.CLUSTERS.LIST)
      } else {
        // Add hosts
        if (addHosts?.length > 0) {
          const hostIds = addHosts?.map?.((host) => host)
          await Promise.all(
            hostIds.map((hostId) => addHost({ id, host: hostId }))
          )
        }

        // Remove hosts
        if (removeHosts?.length > 0) {
          const hostIds = removeHosts?.map?.((host) => host)
          await Promise.all(
            hostIds.map((hostId) => removeHost({ id, host: hostId }))
          )
        }

        // Add vnets
        if (addVnets?.length > 0) {
          const vnetIds = addVnets?.map?.((vnet) => vnet)
          await Promise.all(
            vnetIds.map((vnetId) => addVnet({ id, vnet: vnetId }))
          )
        }

        // Remove vnets
        if (removeVnets?.length > 0) {
          const vnetIds = removeVnets?.map?.((vnet) => vnet)
          await Promise.all(
            vnetIds.map((vnetId) => removeVnet({ id, vnet: vnetId }))
          )
        }

        // Add datastores
        if (addDatastores?.length > 0) {
          const datastoreIds = addDatastores?.map?.((ds) => ds)
          await Promise.all(
            datastoreIds.map((dsId) => addDatastore({ id, datastore: dsId }))
          )
        }

        // Remove datastores
        if (removeDatastores?.length > 0) {
          const datastoreIds = removeDatastores?.map?.((ds) => ds)
          await Promise.all(
            datastoreIds.map((dsId) => removeDatastore({ id, datastore: dsId }))
          )
        }

        // Rename if the name has been changed
        if (changeName) {
          await rename({ id, name: general?.NAME }).unwrap()
        }

        // Update EVC_MODE if it has changed
        if (hosts.EVC_MODE !== cluster?.TEMPLATE?.EVC_MODE) {
          const currentHosts = cluster?.HOSTS?.ID
            ? (Array.isArray(cluster.HOSTS.ID)
                ? [...cluster.HOSTS.ID]
                : [cluster.HOSTS.ID]
              ).sort((a, b) => a - b)
            : []
          const removedHosts = removeHosts
            ? [...removeHosts].sort((a, b) => a - b)
            : []
          const removedAllHosts = currentHosts.every(
            (value, index) => value === removedHosts[index]
          )
          const newTemplate = { ...cluster?.TEMPLATE }
          const evcModeIsEmpty = hosts.EVC_MODE?.trim() === ''
          const hasAddedHosts = addHosts.length > 0
          const shouldSendEvc =
            (!removedAllHosts || hasAddedHosts) && !evcModeIsEmpty

          if (shouldSendEvc) {
            newTemplate.EVC_MODE = hosts.EVC_MODE
          } else {
            delete newTemplate.EVC_MODE
          }

          await update({
            id,
            template: jsonToXml(newTemplate),
            replace: shouldSendEvc ? 1 : 0,
          })
        }

        // Only show cluster message
        enqueueSuccess(T.SuccessClusterUpdated, id)
        // Go to clusters list
        history.push(PATH.INFRASTRUCTURE.CLUSTERS.LIST)
      }
    } catch (error) {
      enqueueError(T.ErrorClusterOperation)
    }
  }

  return (
    <TranslateProvider>
      {version && (!clusterId || (clusterId && cluster)) ? (
        <Cluster.CreateForm
          initialValues={cluster}
          onSubmit={onSubmit}
          stepProps={{
            version,
          }}
          fallback={<SkeletonStepsForm />}
        >
          {(config) => <DefaultFormStepper {...config} />}
        </Cluster.CreateForm>
      ) : (
        <SkeletonStepsForm />
      )}
    </TranslateProvider>
  )
}
