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
import Datastore, {
  STEP_ID as DATASTORE_ID,
} from 'client/components/Forms/Image/CloneForm/Steps/DatastoresTable'

import General, {
  STEP_ID as GENERAL_ID,
} from 'client/components/Forms/Image/CreateForm/Steps/General'

import AdvancedOptions, {
  STEP_ID as ADVANCE_ID,
} from 'client/components/Forms/Image/CreateForm/Steps/AdvancedOptions'

import CustomAttributes, {
  STEP_ID as CUSTOM_ID,
} from 'client/components/Forms/Image/CreateForm/Steps/CustomAttributes'

import { createSteps, cloneObject, set, convertToMB } from 'client/utils'

const Steps = createSteps(
  [General, Datastore, AdvancedOptions, CustomAttributes],
  {
    transformBeforeSubmit: (formData) => {
      const {
        [GENERAL_ID]: general = {},
        [DATASTORE_ID]: [datastore] = [],
        [ADVANCE_ID]: advanced = {},
        [CUSTOM_ID]: custom = {},
      } = formData ?? {}

      const generalData = cloneObject(general)
      set(generalData, 'UPLOAD', undefined)
      set(generalData, 'IMAGE_LOCATION', undefined)

      // ISSUE#6136: Convert size to MB (because XML API uses only MB) and delete sizeunit field (no needed on XML API)
      set(
        generalData,
        'SIZE',
        convertToMB(generalData.SIZE, generalData.SIZEUNIT)
      )
      set(generalData, 'SIZEUNIT', undefined)

      return {
        template: {
          ...custom,
          ...advanced,
          ...generalData,
        },
        datastore: datastore?.ID,
        file: general?.UPLOAD,
      }
    },
  }
)

export default Steps
