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
import { Stack } from '@mui/material'
import { T } from '@ConstantsModule'
import { SCHEMA, FIELDS, COLUMNS } from './schema'

import { AlertNotification, FormWithSchema } from '@ComponentsV2Module'

export const STEP_ID = 'general'

const Content = () => (
  <Stack direction="column" spacing="1em" sx={{ paddingTop: '24px' }}>
    <AlertNotification
      type="primary"
      status="information"
      title={T['groups.general.info']}
      isDismissible={false}
      style={{ width: '100%', boxSizing: 'border-box' }}
    />
    <FormWithSchema
      id={STEP_ID}
      cy={`${STEP_ID}`}
      fields={FIELDS}
      columns={COLUMNS}
    />
  </Stack>
)

/**
 * General Group configuration.
 *
 * @returns {object} General configuration step
 */
const General = () => ({
  id: STEP_ID,
  label: T.General,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
})

General.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

export default General
