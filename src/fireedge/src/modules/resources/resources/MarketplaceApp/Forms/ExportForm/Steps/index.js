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
import General, {
  STEP_ID as GENERAL_ID,
} from '@modules/resources/resources/MarketplaceApp/Forms/ExportForm/Steps/General'
import Destination, {
  STEP_ID as DESTINATION_ID,
} from '@modules/resources/resources/MarketplaceApp/Forms/ExportForm/Steps/Destination'
import { createSteps } from '@UtilsModule'

const Steps = createSteps((app) => [General, Destination].filter(Boolean), {
  transformInitialValue: (app, schema) => schema.cast({}, { context: { app } }),
  transformBeforeSubmit: (formData) => {
    const {
      [GENERAL_ID]: configuration,
      [DESTINATION_ID]: { datastore } = {},
    } = formData

    return {
      datastore,
      ...configuration,
    }
  },
})

export default Steps
