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

import UserInputs from '@modules/components/Forms/Cluster/CreateCloudForm/Steps/UserInputs'

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
    /**
     * 1. GENERAL STEP
     */

    const steps = [() => General()]

    // Group drivers to generate provider step
    const groupedDrivers = createFieldsFromDeploymentConfs(drivers)
    const providerSteps = providers.map((provider) => {
      const selectedDriver = drivers.find(
        (driver) => driver.name === provider.TEMPLATE.PROVIDER_BODY.driver
      )

      return {
        id: provider.ID,
        name: provider.NAME,
        hasSteps: selectedDriver?.deployment_confs?.length > 0,
      }
    })

    /**
     * 2. PROVIDER STEP
     */

    // Add provider step if is not the onpremise case
    steps.push(() => ProvidersStep(providerSteps, onpremiseProvider))

    /**
     * 3. DEPLOYMENT CONF STEP
     */

    // Get deployment configurations available
    const deploymentSteps = []
    groupedDrivers.forEach((driverWithDeployments) => {
      const deploymentConfs = driverWithDeployments.deploymentConfs
      deploymentConfs.forEach((deploymentConf) => {
        const componentName = deploymentConf.deploymentAlias
        const step = {
          name: componentName,
        }
        deploymentSteps.push(step)
      })
    })

    // Add deployment conf step
    steps.push(() => Deployments(providers, groupedDrivers, deploymentSteps))

    /**
     * 4. USER INPUTS STEP: This step is only displayed after select the deployment conf of the step 3
     */

    // Generate user inputs step for each provider and deployment conf
    groupedDrivers.forEach((driverWithDeployments) => {
      const deploymentConfs = driverWithDeployments.deploymentConfs
      const fireedge = driverWithDeployments.fireedge
      const name = driverWithDeployments.name
      deploymentConfs.forEach((deploymentConf) => {
        // Get the user inputs to display
        const userInputs = deploymentConf.deploymentUserInputs

        // Group user inputs
        const userInputsLayout = fireedge?.layout
          ? groupUserInputs(userInputs, fireedge, name)
          : undefined

        // Get the component name
        const componentName = deploymentConf.deploymentAlias
        steps.push(() =>
          UserInputs(componentName, userInputs, userInputsLayout)
        )
      })
    })

    /**
     * 5. TAGS STEP
     */
    steps.push(() => OneformTags())

    // Delete empty steps
    return steps.filter(Boolean)
  },
  {
    transformInitialValue: (initialValues, schema) => {
      // Add onpremise provider if the user selects onpremise provider option
      if (
        initialValues?.onpremiseProvider &&
        initialValues?.onpremProviders &&
        initialValues?.onpremProviders?.length > 0
      ) {
        schema.default()

        const knownTemplate = schema.cast(
          {
            [PROVIDER_ID]: { PROVIDER: initialValues?.onpremProviders[0].ID },
          },
          {
            stripUnknown: true,
          }
        )

        return knownTemplate
      } else {
        return schema.default()
      }
    },
    transformBeforeSubmit: (formData) => {
      const {
        [GENERAL_ID]: generalData,
        [PROVIDER_ID]: providerData,
        [DEPLOYMENT_ID]: deploymentData,
        [TAGS_ID]: tagsData,
      } = formData

      const providerId = providerData.PROVIDER
      const userInputsData = formData[deploymentData.DEPLOYMENT_CONF]
      const [driver, deploymentType] = deploymentData.DEPLOYMENT_CONF.split('-')

      if (tagsData) {
        userInputsData.oneform_tags = tagsData ?? {}
      }

      const template = {
        name: generalData.NAME,
        driver: driver,
        deployment_type: deploymentType,
        provider_id: providerId,
        user_inputs_values: userInputsData,
      }

      const description = generalData.DESCRIPTION

      if (description) {
        return { ...template, description: description }
      }

      return template
    },
  }
)

export default Steps
