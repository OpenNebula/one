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
import { ReactElement } from 'react'
import { generatePath, useHistory, useLocation } from 'react-router-dom'
import { OneKsAPI, useGeneralApi } from '@FeaturesModule'

import {
  DefaultFormStepper,
  Form,
  PATH,
  SkeletonStepsForm,
  TranslateProvider,
} from '@ComponentsModule'
import { T, ONEKS_OPERATIONS } from '@ConstantsModule'
import { createFieldsFromOneKsOdsUserInputs } from '@UtilsModule'

const { OneKsApp } = Form

/**
 * Displays the creation form for a kubernetes cluster.
 *
 * @returns {ReactElement} - The kubernetes cluster form component
 */
export function CreateOneKsCluster() {
  const history = useHistory()
  const { state: { ID: clusterId } = {} } = useLocation()

  const { enqueueSuccess, enqueueError } = useGeneralApi()
  const [createOneKsCluster] = OneKsAPI.useCreateOneKsClusterMutation()

  const { data: families } = OneKsAPI.useGetOneKsFamiliesQuery()

  const familiesUserInputs = createFieldsFromOneKsOdsUserInputs(families)

  const { data: cluster } = clusterId
    ? OneKsAPI.useGetOneKsClustersQuery({ id: clusterId })
    : { data: undefined }

  const onSubmit = async (template) => {
    try {
      // Create cluster
      const newCluster = await createOneKsCluster({ template }).unwrap()

      const newClusterId = newCluster?.DOCUMENT?.ID
      // Go to clusters list
      history.push(
        generatePath(PATH.ONEKS.CREATE_CLOUD_LOGS, {
          id: newClusterId,
        }),
        {
          operation: ONEKS_OPERATIONS.CREATE.name,
        }
      )

      enqueueSuccess(T.SuccessClusterCreated, newClusterId)
    } catch (error) {
      enqueueError(T.ErrorClusterOperation)
    }
  }

  return (
    <TranslateProvider>
      {families ? (
        <OneKsApp.CreateOneKsClusterForm
          initialValues={cluster}
          onSubmit={onSubmit}
          stepProps={{
            families: familiesUserInputs,
          }}
          fallback={<SkeletonStepsForm />}
        >
          {(config) => <DefaultFormStepper {...config} />}
        </OneKsApp.CreateOneKsClusterForm>
      ) : (
        <SkeletonStepsForm />
      )}
    </TranslateProvider>
  )
}
