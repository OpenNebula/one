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
import { FormWithSchema } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { Step } from '@UtilsModule'
import {
  DATASTORE_FIELD,
  FIELDS,
  SCHEMA,
} from '@modules/resources/resources/BackupJobs/Forms/CreateForm/Steps/DatastoreTable/schema'

export const STEP_ID = 'datastores'
export { DATASTORE_FIELD }

const Content = () => (
  <FormWithSchema id={STEP_ID} cy={`${STEP_ID}`} fields={FIELDS} />
)

/**
 * Step to select the Datastore.
 *
 * @returns {Step} Datastore step
 */
const DatastoresStep = () => ({
  id: STEP_ID,
  label: T.SelectDatastores,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
})

export default DatastoresStep
