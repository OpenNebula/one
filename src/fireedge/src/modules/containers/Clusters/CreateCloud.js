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
import {
  DefaultFormStepper,
  Form,
  SkeletonStepsForm,
  TranslateProvider,
  PATH,
} from '@ComponentsModule'
import { ReactElement } from 'react'
import { generatePath, useHistory, useLocation } from 'react-router'

import { T } from '@ConstantsModule'
import {
  ProvisionAPI,
  DriverAPI,
  ProviderAPI,
  useGeneralApi,
} from '@FeaturesModule'
import { get, filter } from 'lodash'
const { Cluster } = Form

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
        })
      )
      enqueueSuccess(T.SuccessProviderCreated, [newProvisionId])
    } catch {
      enqueueError(T.ErrorProviderCreated)
    }
  }

  return (
    <TranslateProvider>
      {!providers || !drivers ? (
        <SkeletonStepsForm />
      ) : (
        <Cluster.CreateCloudForm
          stepProps={{ providers, drivers, onpremiseProvider }}
          initialValues={{
            onpremiseProvider: onpremiseProvider,
            onpremProviders: onpremProviders,
          }}
          onSubmit={onSubmit}
          fallback={<SkeletonStepsForm />}
        >
          {(config) => <DefaultFormStepper {...config} />}
        </Cluster.CreateCloudForm>
      )}
    </TranslateProvider>
  )
}
