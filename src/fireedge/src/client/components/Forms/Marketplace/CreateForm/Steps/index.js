/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
} from 'client/components/Forms/Marketplace/CreateForm/Steps/General'

import Configuration, {
  STEP_ID as CONFIGURATION_ID,
} from 'client/components/Forms/Marketplace/CreateForm/Steps/Configuration'

import { createSteps } from 'client/utils'

/**
 * Create steps for Marketplace Create Form:
 * 1. General: General attributes for marketplace
 * 2. Configuration: Configuration attributes for marketplace depending its type
 */
const Steps = createSteps([General, Configuration], {
  transformInitialValue: (marketplace, schema) => {
    const knownTemplate = schema.cast(
      {
        [GENERAL_ID]: {
          NAME: marketplace.NAME,
          DESCRIPTION: marketplace.TEMPLATE.DESCRIPTION,
          MARKET_MAD: marketplace.MARKET_MAD,
        },
        [CONFIGURATION_ID]: {
          ...marketplace.TEMPLATE,
          BRIDGE_LIST: marketplace?.TEMPLATE.BRIDGE_LIST?.split(' '),
        },
      },
      {
        stripUnknown: true,
      }
    )

    return knownTemplate
  },

  transformBeforeSubmit: (formData, initialValues) => {
    // Get data from steps
    const { [GENERAL_ID]: generalData } = formData
    const { [CONFIGURATION_ID]: configurationData } = formData

    // Check if the name has been changed
    const changeName =
      initialValues && initialValues?.NAME !== generalData?.NAME
        ? generalData?.NAME
        : undefined

    return {
      ...generalData,
      ...configurationData,
      changeName,
    }
  },
})

export default Steps
