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
} from '@modules/components/Forms/Provider/CreateForm/Steps/General'

import DriversStep, {
  STEP_ID as DRIVER_ID,
} from '@modules/components/Forms/Provider/CreateForm/Steps/DriversTable'

import ConnectionValues from '@modules/components/Forms/Provider/CreateForm/Steps/ConnectionValues'

import { createFieldsFromDriversOdsUserInputs } from '@modules/components/Forms/Oneform'

import { createSteps } from '@UtilsModule'
import { isEmpty } from 'lodash'

const Steps = createSteps(
  ({ dataTemplate = {}, drivers = [] }) => {
    const steps = []
    let driversSteps, groupedDrivers
    // if dataTemplateExtended is populated, render DriverStep but disabled
    if (!isEmpty(dataTemplate)) {
      const selectedProvider = dataTemplate.TEMPLATE.PROVIDER_BODY ?? {}
      const providerDriver = drivers.find(
        (driver) => driver.name === selectedProvider?.driver
      )
      groupedDrivers = createFieldsFromDriversOdsUserInputs([providerDriver])
      const connectionValuesFields = groupedDrivers[0]
      const driverFields = groupedDrivers[0].driverFields
      driversSteps = [
        {
          name: selectedProvider.name,
        },
      ]
      steps.push(() => DriversStep(driversSteps, true))
      steps.push(() => General())
      if (driverFields && driverFields.length > 0) {
        steps.push(() => ConnectionValues(connectionValuesFields, false))
      }
    } else {
      // Group drivers with their connection values to get if step is available or not
      groupedDrivers = createFieldsFromDriversOdsUserInputs(drivers)
      driversSteps = groupedDrivers?.map((driver) => ({
        name: driver?.name,
        hasSteps: driver?.driverFields?.length > 0,
      }))
      steps.push(() => DriversStep(driversSteps))
      steps.push(() => General())
      // If available connection values, it will be as part of the Form Stepper
      groupedDrivers.forEach((driver) => {
        steps.push(() => ConnectionValues(driver))
      })
    }

    return steps.filter(Boolean)
  },
  {
    saveState: true,
    transformInitialValue: (Provider, schema) => {
      const { NAME: name } = Provider

      const template = Provider?.TEMPLATE?.PROVIDER_BODY ?? {}

      const { description, driver, connection: connectionValues } = template

      const objectSchema = {
        [GENERAL_ID]: { name, description },
        [DRIVER_ID]: { DRIVER: driver },
        [driver]: connectionValues,
      }

      const knownTemplate = schema.cast(objectSchema, { stripUnknown: true })

      return knownTemplate
    },

    transformBeforeSubmit: (formData) => {
      const { [GENERAL_ID]: generalData, [DRIVER_ID]: driverData } = formData

      const connectionValuesData = formData[driverData.DRIVER]

      const template = {
        name: generalData.name,
        driver: driverData.DRIVER,
        connection_values: connectionValuesData || {}, // create
        connection: connectionValuesData || {}, // update
      }

      const description = generalData.description

      if (description) {
        return { ...template, description: description }
      }

      return template
    },
  }
)

export default Steps
