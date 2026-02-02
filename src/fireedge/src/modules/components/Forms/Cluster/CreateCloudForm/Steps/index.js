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
import General, {
  STEP_ID as GENERAL_ID,
} from '@modules/components/Forms/Cluster/CreateCloudForm/Steps/General'
import ProvidersStep, {
  STEP_ID as PROVIDER_ID,
} from '@modules/components/Forms/Cluster/CreateCloudForm/Steps/ProvidersTable'

import Deployments, {
  STEP_ID as DEPLOYMENT_ID,
} from '@modules/components/Forms/Cluster/CreateCloudForm/Steps/Deployments'

import UserInputs, {
  STEP_ID as USER_INPUTS_ID,
} from '@modules/components/Forms/Cluster/CreateCloudForm/Steps/UserInputs'

import OneformTags, {
  STEP_ID as TAGS_ID,
} from '@modules/components/Forms/Cluster/CreateCloudForm/Steps/OneformTags'

import { createFieldsFromDeploymentConfs } from '@modules/components/Forms/Oneform'

import { createSteps, groupUserInputs } from '@UtilsModule'

/**
 * Create steps for Cluster using OneForm:
 * 1. General: Name of the cluster
 */
const Steps = createSteps(
  ({ providers = [], drivers = [], onpremiseProvider = false }) => {
    const steps = []

    // Group drivers to generate provider step
    const groupedDrivers = createFieldsFromDeploymentConfs(drivers)

    // Generate user inputs step for each provider and deployment conf
    const groupConfs = groupedDrivers.map((driverWithDeployments) => {
      const deploymentConfs = driverWithDeployments.deploymentConfs
      const fireedge = driverWithDeployments.fireedge
      const name = driverWithDeployments.name

      const test = deploymentConfs.map((deploymentConf) => {
        // Get the user inputs to display
        const userInputs = deploymentConf.deploymentUserInputs

        // Group user inputs
        const userInputsLayout = fireedge?.layout
          ? groupUserInputs(userInputs, fireedge, name)
          : undefined

        return {
          ...deploymentConf,
          userInputsLayout,
        }
      })

      return {
        ...driverWithDeployments,
        deploymentConfs: test,
      }
    })

    const deploymentConfsList = groupConfs.flatMap((e) => e.deploymentConfs)

    // STEP 1. Providers - Add provider step if is not the onpremise case
    steps.push(() => ProvidersStep({ onpremiseProvider }))

    // STEP 2. General information
    steps.push(() => General())

    // STEP 3. Deployment configurations
    steps.push(() =>
      Deployments({
        providers,
        groupedDrivers,
        deploymentConfsList,
      })
    )

    // STEP 4. User inputs
    steps.push(() => UserInputs({ deploymentConfs: deploymentConfsList }))

    // STEP 5. Tags
    steps.push(() => OneformTags())

    // Return steps
    return steps
  },
  {
    transformInitialValue: (initialValues, schema) => {
      // Add onpremise provider if the user selects onpremise provider option
      if (
        initialValues?.onpremiseProvider &&
        initialValues?.onpremProviders &&
        initialValues?.onpremProviders?.length > 0
      ) {
        // Add default data to the schema
        schema.default()

        // Add the onprem provider
        const knownTemplate = schema.cast(
          {
            [PROVIDER_ID]: { PROVIDER: initialValues?.onpremProviders[0].ID },
          },
          {
            stripUnknown: true,
          }
        )

        // Return template with onprem provider
        return knownTemplate
      } else {
        // Return template without provider
        return schema.default()
      }
    },
    transformBeforeSubmit: (formData) => {
      // Get data from steps
      const {
        [GENERAL_ID]: generalData,
        [PROVIDER_ID]: providerData,
        [DEPLOYMENT_ID]: deploymentData,
        [USER_INPUTS_ID]: userInputsData,
        [TAGS_ID]: tagsData,
      } = formData

      // Get provider id, driver name and deployment type
      const providerId = providerData.PROVIDER
      const [driver, deploymentType] = deploymentData.DEPLOYMENT_CONF.split('-')

      // Tags will be send as user inputs
      if (tagsData) {
        userInputsData.oneform_tags = tagsData ?? {}
      }

      // Create template to send to oneform
      const template = {
        name: generalData.NAME,
        driver: driver,
        deployment_type: deploymentType,
        provider_id: providerId,
        user_inputs_values: userInputsData,
      }

      return template
    },
  }
)

export default Steps
