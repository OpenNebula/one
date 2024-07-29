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

import FormWithSchema from 'client/components/Forms/FormWithSchema'

import { SCHEMA, FIELDS } from './schema'
import { T } from 'client/constants'

export const STEP_ID = 'confAttributes'

const Content = () => (
  <FormWithSchema id={STEP_ID} fields={FIELDS} cy={`${STEP_ID}`} />
)

/**
 * General configuration about VM Template.
 *
 * @returns {object} General configuration step
 */
const General = () => ({
  id: STEP_ID,
  label: T.ConfigurationAttributes,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
})

export default General
