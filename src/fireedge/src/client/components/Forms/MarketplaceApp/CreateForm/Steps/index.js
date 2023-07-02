/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import BasicConfiguration, {
  STEP_ID as BASIC_ID,
} from 'client/components/Forms/MarketplaceApp/CreateForm/Steps/BasicConfiguration'
import MarketplacesTable, {
  STEP_ID as MARKET_ID,
} from 'client/components/Forms/MarketplaceApp/CreateForm/Steps/MarketplacesTable'
import { createSteps } from 'client/utils'

const Steps = createSteps([BasicConfiguration, MarketplacesTable], {
  transformInitialValue: (initialValues, schema) =>
    schema.cast({ [BASIC_ID]: initialValues }, { stripUnknown: true }),
  transformBeforeSubmit: (formData) => {
    const { [BASIC_ID]: configuration, [MARKET_ID]: [market] = [] } = formData

    return { marketId: market?.ID, ...configuration }
  },
})

export default Steps
