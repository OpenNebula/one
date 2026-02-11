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

import ConnectionValues, {
  STEP_ID as CONNECTION_VALUES_ID,
} from '@modules/components/Forms/Provider/CreateForm/Steps/ConnectionValues'

import { createFieldsFromDriversOdsUserInputs } from '@modules/components/Forms/Oneform'
import { createSteps } from '@UtilsModule'
import { isEmpty } from 'lodash'

const Steps = createSteps(
  ({ dataTemplate = {}, drivers = [] }) => {
    // Create steps list
    const steps = []

    // Create the Sunstone user inputs that will be used in each provider, avoiding to
    // show the sensitive fields in case of update.
    const isUpdate = !isEmpty(dataTemplate)
    const groupedDrivers = createFieldsFromDriversOdsUserInputs(drivers)

    // STEP 1. Drivers
    steps.push(() => DriversStep({ update: isUpdate, groupedDrivers }))

    // STEP 2. General information
    steps.push(() => General())

    // STEP 3. Connection values
    steps.push(() => ConnectionValues({ isUpdate, groupedDrivers }))

    // Return steps
    return steps
  },
  {
    transformInitialValue: (provider, schema) => {
      // Get provider name
      const { NAME: name } = provider

      // Get provider template
      const template = provider?.TEMPLATE?.PROVIDER_BODY ?? {}

      // Get provider attributes
      const { description, driver, connection: connectionValues } = template

      // Create object with the initial data
      const objectSchema = {
        [GENERAL_ID]: { name, description },
        [DRIVER_ID]: { DRIVER: driver },
        [CONNECTION_VALUES_ID]: connectionValues,
      }

      // Cast to validate data
      const knownTemplate = schema.cast(objectSchema, { stripUnknown: false })

      // Return data
      return knownTemplate
    },
    transformBeforeSubmit: (formData) => {
      // Get data from the form
      const {
        [GENERAL_ID]: generalData,
        [DRIVER_ID]: driverData,
        [CONNECTION_VALUES_ID]: connectionValuesData,
      } = formData

      // Create template to send to oneform
      const template = {
        ...generalData,
        driver: driverData.DRIVER,
        connection_values: connectionValuesData || {}, // create
        connection: connectionValuesData || {}, // update
      }

      return template
    },
  }
)

export default Steps
