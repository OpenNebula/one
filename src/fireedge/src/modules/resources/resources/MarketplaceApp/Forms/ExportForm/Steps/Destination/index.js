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
import { T } from '@ConstantsModule'
import { Step } from '@UtilsModule'
import {
  FIELDS,
  SCHEMA,
} from '@modules/resources/resources/MarketplaceApp/Forms/ExportForm/Steps/Destination/schema'

export const STEP_ID = 'datastore'

const Content = ({ app }) => (
  <FormWithSchema id={STEP_ID} cy={STEP_ID} fields={FIELDS(app)} />
)

/**
 * Step to select the Datastore.
 *
 * @param {object} app - Marketplace App resource
 * @returns {Step} Datastore step
 */
const Destination = (app) => ({
  id: STEP_ID,
  label: T.SelectDatastore,
  resolver: SCHEMA(app),
  content: (props) => Content({ ...props, app }),
})

Content.propTypes = {
  app: PropTypes.object,
}

export default Destination
