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
import { INPUT_TYPES, T } from '@ConstantsModule'
import { Field, getObjectSchemaFromFields, arrayToOptions } from '@UtilsModule'
import { ObjectSchema, string } from 'yup'
import { findIndex } from 'lodash'

/** @type {Field} Name field */
const DEPLOYMENT_CONF = (providers, groupedDrivers, deploymentSteps) => {
  const stepControl = []

  deploymentSteps?.forEach((deploymentStep, index) => {
    const deploymentConf = {
      condition: (deployment) =>
        findIndex(deploymentSteps, { name: deployment }) !== index,
      steps: [deploymentSteps[index].name],
    }
    stepControl.push(deploymentConf)
  })

  return {
    name: 'DEPLOYMENT_CONF',
    label: T['cluster.deployment_conf'],
    type: INPUT_TYPES.AUTOCOMPLETE,
    optionsOnly: true,
    dependOf: '$provider.PROVIDER',
    dependencies: '$provider.PROVIDER',
    clearInvalid: true,
    values: (providerId = []) => {
      const selectedProvider = providers.find((p) => p.ID === providerId)
      const selectedDriver = selectedProvider
        ? groupedDrivers.find(
            (driver) =>
              driver.name === selectedProvider.TEMPLATE.PROVIDER_BODY.driver
          )
        : {}

      return arrayToOptions(selectedDriver?.deploymentConfs, {
        addEmpty: true,
        getText: ({ deploymentName }) => deploymentName,
        getValue: ({ deploymentAlias }) => deploymentAlias,
      })
    },
    validation: string()
      .trim()
      .required()
      .default(() => undefined),
    grid: { md: 12 },
    stepControl: stepControl,
  }
}

/**
 * @param {Array} providers - Array of Providers
 * @param {Array} groupedDrivers - Array of drivers with deployment configurations fields
 * @param {Array} deploymentSteps - Array of deployment steps
 * @returns {Field[]} Fields
 */
const FIELDS = (providers, groupedDrivers, deploymentSteps) => [
  DEPLOYMENT_CONF(providers, groupedDrivers, deploymentSteps),
]

/**
 * @param {Array} providers - Array of Providers
 * @param {Array} groupedDrivers - Array of drivers with deployment configurations fields
 * @returns {ObjectSchema} Schema
 */
const SCHEMA = (providers, groupedDrivers) =>
  getObjectSchemaFromFields(FIELDS(providers, groupedDrivers))

export { SCHEMA, FIELDS }
