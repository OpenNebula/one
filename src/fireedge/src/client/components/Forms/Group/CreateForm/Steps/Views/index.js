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

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

import { generateDocLink } from 'client/utils'

import { VIEWS_SCHEMA, VIEWS_FIELDS } from './schema'
import { Stack, Card, CardContent, Typography } from '@mui/material'

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
        gridTemplateColumns: { sm: '1fr', md: '1fr 1fr 1fr' },
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
      <Card
        elevation={2}
        sx={{
          height: '100%',
          maxHeight: '630px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
        }}
      >
        <CardContent
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1em',
          }}
        >
          <Typography variant="h6" component="div" gutterBottom>
            {' '}
            {Tr(T['groups.views.help.title1'])}{' '}
          </Typography>
          <Typography variant="body2" gutterBottom>
            {' '}
            {Tr(T['groups.views.help.paragraph.1'])}{' '}
          </Typography>
          <Typography variant="body2" gutterBottom>
            {' '}
            {Tr(T['groups.views.help.paragraph.2'])}{' '}
          </Typography>
          <Typography variant="body2" gutterBottom>
            {' '}
            {Tr(T['groups.views.help.paragraph.3'])}{' '}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <a
              target="_blank"
              href={generateDocLink(
                version,
                'management_and_operations/users_groups_management/fireedge_sunstone_views.html'
              )}
              rel="noreferrer"
            >
              {Tr(T['groups.views.help.paragraph.link'])}
            </a>
          </Typography>
        </CardContent>
      </Card>
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
})

ViewOptions.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

export default ViewOptions
