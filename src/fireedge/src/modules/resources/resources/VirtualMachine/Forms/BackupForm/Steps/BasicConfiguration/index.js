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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'

import { FormWithSchema } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'

import {
  SCHEMA,
  FIELDS,
} from '@modules/resources/resources/VirtualMachine/Forms/BackupForm/Steps/BasicConfiguration/schema'
import { Step } from '@UtilsModule'
import { Box } from '@mui/material'

export const STEP_ID = 'configuration'

const Content = (props) => {
  const fields = FIELDS(props)

  return (
    <Box>
      <FormWithSchema
        cy="restore-configuration"
        id={STEP_ID}
        fields={fields}
        columns={[[], fields, []]}
        gridContainerSx={{
          gridTemplateColumns: { xs: '1fr', md: '1fr 2fr 1fr' },
        }}
      />
    </Box>
  )
}

/**
 * Step to configure the marketplace app.
 *
 * @param {object} props - Step props
 * @returns {Step} Configuration step
 */
const ConfigurationStep = (props) => ({
  id: STEP_ID,
  label: T.Configuration,
  resolver: () => SCHEMA(props),
  optionsValidate: { abortEarly: false },
  content: () => Content(props),
})

Content.propTypes = {
  vmId: PropTypes.string,
  data: PropTypes.any,
  setFormData: PropTypes.func,
  nics: PropTypes.array,
  isMultiple: PropTypes.bool,
}

export default ConfigurationStep
