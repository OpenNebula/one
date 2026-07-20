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

import { FIELDS, SCHEMA } from './schema'

export const STEP_ID = 'general'
const COLUMNS = [[], FIELDS, []]

const Content = () => (
  <FormWithSchema
    cy={STEP_ID}
    fields={FIELDS}
    id={STEP_ID}
    columns={COLUMNS}
    gridContainerSx={{
      gridTemplateColumns: { xs: '1fr', md: '1fr 2fr 1fr' },
    }}
  />
)

/**
 * Step to configure the general marketplace app information.
 *
 * @returns {Step} General step
 */
const GeneralStep = () => ({
  id: STEP_ID,
  label: T.General,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
}

export default GeneralStep
