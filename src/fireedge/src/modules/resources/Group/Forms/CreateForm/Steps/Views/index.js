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
import { VIEWS_SCHEMA, VIEWS_FIELDS } from './schema'
import { Stack } from '@mui/material'

export const STEP_ID = 'views'

const Content = (views, version) => {
  // Get view fields
  const fieldsUser = VIEWS_FIELDS(views, false)
  const fieldsAdmin = VIEWS_FIELDS(views, true)

  return (
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
        fields={fieldsUser}
        legend={T['groups.views.group.section']}
        legendTooltip={T['groups.views.group.tooltip']}
      />
      <FormWithSchema
        id={STEP_ID}
        cy={`${STEP_ID}`}
        fields={fieldsAdmin}
        legend={T['groups.views.admin.section']}
        legendTooltip={T['groups.views.admin.tooltip']}
        tooltip="pepe"
      />
    </Stack>
  )
}

/**
 * View Options group configuration that includes views and system.
 *
 * @param {object} props - Object with properties
 * @param {Array} props.views - List of views
 * @param {string} props.version - Version of ONE
 * @returns {object} ViewOptions configuration step
 */
const ViewOptions = ({ views, version }) => ({
  id: STEP_ID,
  label: T['groups.views.title'],
  resolver: VIEWS_SCHEMA(views),
  optionsValidate: { abortEarly: false },
  content: () => Content(views, version),
  documentation: {
    title: T['groups.views.help.title'],
    content: [
      T['groups.views.help.paragraph.1'],
      T['groups.views.help.paragraph.2'],
      T['groups.views.help.paragraph.3'],
    ],
    link: 'product/cloud_system_administration/multitenancy/fireedge_sunstone_views',
    version,
  },
})

ViewOptions.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

export default ViewOptions
