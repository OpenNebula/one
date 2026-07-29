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
  Cluster,
  DefaultFormStepper,
  SkeletonStepsForm,
} from '@ResourcesModule'

import { createFieldsFromDeploymentConfs } from '@UtilsModule'
import { ReactElement } from 'react'
import { generatePath, useHistory, useLocation } from 'react-router'

import { T, CLUSTER_CLOUD_OPERATIONS, PATH } from '@ConstantsModule'
import {
  ProvisionAPI,
  DriverAPI,
  ProviderAPI,
  useGeneralApi,
} from '@FeaturesModule'
import { get, filter } from 'lodash'

/**
 * Displays the creation form for a cluster.
 *
 * @returns {ReactElement} - The cluster form component
 */
export function CreateClusterCloud() {
  // Get history to redirect to forms
  const history = useHistory()
  const { enqueueError, enqueueSuccess } = useGeneralApi()

  // Check if using onpremise provider
  const { state: { onpremiseProvider = false } = {} } = useLocation()

  const { data: providers } = ProviderAPI.useGetProvidersQuery()
  const { data: drivers } = DriverAPI.useGetDriversQuery()

  // Use _.filter to get all items with driver="onprem" so when the user choose onprem, use the default onprem provider
  const onpremProviders = filter(
    providers,
    (item) => get(item, 'TEMPLATE.PROVIDER_BODY.driver') === 'onprem'
  )

  // Group drivers to generate provider step
  const groupedDrivers = createFieldsFromDeploymentConfs(drivers)

  // Create cluster request
  const [allocateOneFormCluster] = ProvisionAPI.useCreateProvisionMutation()

  // In this current version only Provision creation is supported
  const onSubmit = async (jsonTemplate) => {
    try {
      const {
        DOCUMENT: { ID: newProvisionId },
      } = await allocateOneFormCluster({
        template: jsonTemplate,
      }).unwrap()
      history.push(
        generatePath(PATH.INFRASTRUCTURE.CLUSTERS.CREATE_CLOUD_LOGS, {
          id: newProvisionId,
        }),
        {
          operation: CLUSTER_CLOUD_OPERATIONS.CREATE.name,
        }
      )
      enqueueSuccess(T.SuccessProvisionCreated, [newProvisionId])
    } catch {
      enqueueError(T.ErrorProviderCreated)
    }
  }

  return (
    <>
      {!providers || !drivers ? (
        <SkeletonStepsForm />
      ) : (
        <Cluster.Forms.CreateCloudForm
          stepProps={{ providers, groupedDrivers, onpremiseProvider }}
          initialValues={{
            onpremiseProvider: onpremiseProvider,
            onpremProviders: onpremProviders,
          }}
          onSubmit={onSubmit}
          fallback={<SkeletonStepsForm />}
        >
          {(config) => <DefaultFormStepper {...config} />}
        </Cluster.Forms.CreateCloudForm>
      )}
    </>
  )
}
