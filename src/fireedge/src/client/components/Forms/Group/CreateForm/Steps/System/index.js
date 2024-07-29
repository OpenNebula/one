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
import PropTypes from 'prop-types'
import FormWithSchema from 'client/components/Forms/FormWithSchema'

import { T } from 'client/constants'

import { SCHEMA, SYSTEM_FIELDS } from './schema'
import { Stack } from '@mui/material'

export const STEP_ID = 'system'

/**
 * Return content of the step.
 *
 * @returns {object} - Content of the step
 */
const Content = () => (
  <Stack
    display="grid"
    gap="1em"
    sx={{
      gridTemplateColumns: { sm: '1fr', md: '1fr 1fr' },
      padding: '0.5em',
    }}
  >
    <FormWithSchema
      id={STEP_ID}
      cy={`${STEP_ID}`}
      fields={SYSTEM_FIELDS}
      legend={T.System}
    />
  </Stack>
)

/**
 * Advanced Options group configuration that includes views and system.
 *
 * @returns {object} AdvancedOptions configuration step
 */
const System = () => ({
  id: STEP_ID,
  label: T.System,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
})

System.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

export default System
