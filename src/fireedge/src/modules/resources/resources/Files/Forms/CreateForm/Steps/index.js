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
import Datastore, {
  DATASTORE_FIELD,
  STEP_ID as DATASTORE_ID,
} from '@modules/resources/resources/Files/Forms/CreateForm/Steps/DatastoresTable'

import General, {
  STEP_ID as GENERAL_ID,
} from '@modules/resources/resources/Files/Forms/CreateForm/Steps/General'

import { createSteps, cloneObject, set } from '@UtilsModule'

const Steps = createSteps([General, Datastore], {
  transformBeforeSubmit: (formData) => {
    const {
      [GENERAL_ID]: general = {},
      [DATASTORE_ID]: { [DATASTORE_FIELD]: datastore } = {},
    } = formData ?? {}

    const generalData = cloneObject(general)
    set(generalData, 'UPLOAD', undefined)
    set(generalData, 'IMAGE_LOCATION', undefined)

    return {
      template: {
        ...generalData,
      },
      datastore,
      file: general?.UPLOAD,
    }
  },
})

export default Steps
