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
import { Box, Stack } from '@mui/material'
import { FormWithSchema } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { SCHEMA, FIELDS, COLUMNS } from './schema'

export const STEP_ID = 'general'

const Content = () => (
  <Stack direction="column" spacing="1em" sx={{ paddingTop: '24px' }}>
    <FormWithSchema
      id={STEP_ID}
      cy={`${STEP_ID}`}
      fields={FIELDS}
      columns={COLUMNS}
      gridContainerSx={{
        gridTemplateColumns: { xs: '1fr', md: '1fr 2fr 1fr' },
      }}
    />
  </Stack>
)

const GeneralDocumentation = () => (
  <Stack gap="1em">
    <Box>{T['marketplace.general.help.paragraph.1']}</Box>
    <Box component="ul" sx={{ my: 0, pl: 4 }}>
      <li>{T['marketplace.general.help.paragraph.2.1']}</li>
      <li>{T['marketplace.general.help.paragraph.2.2']}</li>
    </Box>
    <Box>{T['marketplace.general.help.paragraph.3']}</Box>
  </Stack>
)

/**
 * General Marketplace configuration.
 *
 * @param {object} props - Step props
 * @param {string} props.version - OpenNebula version
 * @returns {object} General configuration step
 */
const General = ({ version }) => ({
  id: STEP_ID,
  label: T.General,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
  documentation: {
    title: T['marketplace.general.help.title'],
    content: GeneralDocumentation,
    link: 'marketplace/index.html',
    version,
  },
})

General.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
  version: PropTypes.string,
}

export default General
