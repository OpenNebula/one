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
import PropTypes from 'prop-types'

import { FormWithSchema } from '@ComponentsV2Module'
import { Step } from '@UtilsModule'
import { T } from '@ConstantsModule'
import {
  DATASTORE_FIELD,
  getFields,
  getSchema,
} from '@modules/resources/resources/Image/Forms/CloneForm/Steps/DatastoresTable/schema'

export const STEP_ID = 'datastore'
export { DATASTORE_FIELD }

const Content = ({ app }) => (
  <FormWithSchema id={STEP_ID} cy={`${STEP_ID}`} fields={getFields(app)} />
)

/**
 * Step to select the Datastore.
 *
 * @param {object} app - Marketplace App resource
 * @returns {Step} Datastore step
 */
const DatastoreStep = (app) => ({
  id: STEP_ID,
  label: T.SelectDatastoreImage,
  resolver: getSchema(app),
  optionsValidate: { abortEarly: false },
  content: (props) => <Content {...props} app={app} />,
})

Content.propTypes = {
  app: PropTypes.object,
}

export default DatastoreStep
