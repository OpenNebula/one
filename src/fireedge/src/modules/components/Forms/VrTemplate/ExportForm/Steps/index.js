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
import DatastoresTable, {
  STEP_ID as DATASTORE_ID,
} from '@modules/components/Forms/VrTemplate/ExportForm/Steps/DatastoresTable'
import { createSteps } from '@UtilsModule'

const Steps = createSteps(() => [DatastoresTable].filter(Boolean), {
  transformInitialValue: (app, schema) => schema.cast({}, { context: { app } }),
  transformBeforeSubmit: (formData) => {
    const { [DATASTORE_ID]: [datastore] = [] } = formData

    return {
      datastore: datastore?.ID,
    }
  },
})

export default Steps
