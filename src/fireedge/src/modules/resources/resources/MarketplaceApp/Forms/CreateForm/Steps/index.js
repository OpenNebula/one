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
} from '@modules/resources/resources/MarketplaceApp/Forms/CreateForm/Steps/General'
import Source, {
  STEP_ID as SOURCE_ID,
} from '@modules/resources/resources/MarketplaceApp/Forms/CreateForm/Steps/Source'
import Destination, {
  STEP_ID as DESTINATION_ID,
} from '@modules/resources/resources/MarketplaceApp/Forms/CreateForm/Steps/Destination'
import { RESOURCE_NAMES } from '@ConstantsModule'
import { createSteps, jsonToXml } from '@UtilsModule'

const Steps = createSteps([General, Source, Destination], {
  transformInitialValue: (initialValues, schema) =>
    schema.cast(
      {
        [GENERAL_ID]: initialValues,
        [SOURCE_ID]: initialValues,
      },
      { stripUnknown: true }
    ),
  transformBeforeSubmit: (formData) => {
    const {
      [GENERAL_ID]: general,
      [SOURCE_ID]: source,
      [DESTINATION_ID]: { marketId } = {},
    } = formData
    const resource = String(source?.type).toLowerCase()
    const image = {
      ...general?.image,
      ...source?.image,
    }

    if (resource === RESOURCE_NAMES.IMAGE) {
      return {
        resource,
        id: marketId,
        template: jsonToXml({
          ORIGIN_ID: source?.id,
          NAME: general?.vmname,
          ...image,
        }),
      }
    }

    return {
      resource,
      marketId,
      ...general,
      ...source,
      image,
    }
  },
})

export default Steps
