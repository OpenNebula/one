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
import { createForm } from '@UtilsModule'

import {
  FIELDS,
  SCHEMA,
} from '@modules/resources/Forms/Service/PerformAction/schema'

const PerformActionForm = createForm(SCHEMA, FIELDS, {
  transformBeforeSubmit: (formData) => {
    // Transform args for an action that needs some arguments
    if (formData?.ARGS) {
      const { DISK_ID, NAME, SNAPSHOT_ID } = formData.ARGS

      if (DISK_ID && NAME) {
        formData.ARGS = `${DISK_ID},${NAME}`
      } else if (DISK_ID && SNAPSHOT_ID) {
        formData.ARGS = `${DISK_ID},${SNAPSHOT_ID}`
      } else if (NAME) {
        formData.ARGS = NAME
      } else if (SNAPSHOT_ID) {
        formData.ARGS = SNAPSHOT_ID
      }
    }

    return formData
  },
})

export default PerformActionForm
