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
import { schemaOdsUserInputField } from '@UtilsModule'

/**
 * Create a list of fields to use in the schema and in forms from the list of ODS User Inputs.
 *
 * @param {Array} drivers - List of drivers.
 * @returns {Array} - List of fields.
 */
const createFieldsFromDriversOdsUserInputs = (drivers = []) => {
  const driverNames = drivers.map((driver) => driver.name)
  const groupedConnectionValues = drivers.map((driver, index) => ({
    name: driverNames[index],
    connection: driver.connection,
  }))

  const groupedFields = groupedConnectionValues.map(
    ({ name: driverName, connection }) => ({
      name: driverName,
      driverFields: connection.map((connectionValue) =>
        schemaOdsUserInputField(connectionValue)
      ),
    })
  )

  return groupedFields
}

/**
 * Create an object with the fields for each available deployment configuration
 * for a specific provider with its associated driver.
 *
 * @param {Array} drivers - Array of available drivers
 * @returns {Array} An array of objects where each object contains the driver name
 * and an array with the deployment configurations and fields
 */
const createFieldsFromDeploymentConfs = (drivers = []) => {
  const driverNames = drivers.map((driver) => driver.name)
  const groupedDeploymentConfs = drivers.map((driver, index) => ({
    name: driverNames[index],
    userInputs: driver.user_inputs,
    deploymentConfs: driver.deployment_confs,
    fireedge: driver?.fireedge,
  }))

  const groupedFields = groupedDeploymentConfs.map(
    ({ name: driverName, userInputs, deploymentConfs, fireedge }) => {
      const deploymentUserInputsFields = deploymentConfs.map(
        (deploymentConf) => {
          const deploymentConfUserInputs = deploymentConf.user_inputs ?? []
          // this is a special case, since oneform_tags user inputs
          // are going to be treated in the OneformTags step
          const filteredUserInputs = userInputs.filter(
            (ui) => ui.name !== 'oneform_tags'
          )
          const deploymentUserInputs = filteredUserInputs.concat(
            deploymentConfUserInputs
          )
          const resultUserInputs = deploymentUserInputs.map((ui) =>
            schemaOdsUserInputField(ui)
          )

          return {
            deploymentName: deploymentConf.name,
            deploymentAlias: `${driverName}-${deploymentConf.inventory}`,
            deploymentInventory: deploymentConf.inventory,
            deploymentDescription: deploymentConf.description,
            deploymentUserInputs: resultUserInputs,
          }
        }
      )

      return {
        name: driverName,
        deploymentConfs: deploymentUserInputsFields,
        fireedge: fireedge,
      }
    }
  )

  return groupedFields
}

export { createFieldsFromDriversOdsUserInputs, createFieldsFromDeploymentConfs }
