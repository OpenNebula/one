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

import {
  SCHEMA,
  PERMISSIONS_VIEW_FIELDS,
  PERMISSIONS_CREATE_FIELDS,
  PERMISSIONS_CREATE_FIELDS_ADVANCED,
  PERMISSIONS_VIEW_FIELDS_ADVANCED,
} from './schema'
import {
  Stack,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'

export const STEP_ID = 'permissions'

const Content = (version) => (
  <Stack
    display="grid"
    gap="1em"
    sx={{
      gridTemplateColumns: { sm: '1fr', md: '1fr 1fr 1fr' },
      padding: '0.5em',
    }}
  >
    <div>
      <FormWithSchema
        id={STEP_ID}
        cy={`${STEP_ID}`}
        fields={PERMISSIONS_CREATE_FIELDS}
        legend={T['groups.permissions.create.section']}
        legendTooltip={T['groups.permissions.create.section.concept']}
      />

      <Accordion
        variant="transparent"
        TransitionProps={{ unmountOnExit: false }}
      >
        <AccordionSummary
          sx={{
            padding: '0em',
          }}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography>{Tr(T['groups.permissions.resources'])}</Typography>
        </AccordionSummary>
        <AccordionDetails
          sx={{
            padding: '0em',
          }}
        >
          <FormWithSchema
            id={STEP_ID}
            cy={`${STEP_ID}`}
            fields={PERMISSIONS_CREATE_FIELDS_ADVANCED}
          />
        </AccordionDetails>
      </Accordion>
    </div>
    <div>
      <FormWithSchema
        id={STEP_ID}
        cy={`${STEP_ID}`}
        fields={PERMISSIONS_VIEW_FIELDS}
        legend={T['groups.permissions.view.section']}
        legendTooltip={T['groups.permissions.view.section.concept']}
      />
      <Accordion
        variant="transparent"
        TransitionProps={{ unmountOnExit: false }}
      >
        <AccordionSummary
          sx={{
            padding: '0em',
          }}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography>{Tr(T['groups.permissions.resources'])}</Typography>
        </AccordionSummary>
        <AccordionDetails
          sx={{
            padding: '0em',
          }}
        >
          <FormWithSchema
            id={STEP_ID}
            cy={`${STEP_ID}`}
            fields={PERMISSIONS_VIEW_FIELDS_ADVANCED}
          />
        </AccordionDetails>
      </Accordion>
    </div>
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
          {Tr(T['groups.permissions.help.title'])}{' '}
        </Typography>
        <Typography variant="body2" gutterBottom>
          {' '}
          {Tr(T['groups.permissions.help.paragraph.1'])}{' '}
        </Typography>
        <Typography variant="body2" gutterBottom>
          {' '}
          {Tr(T['groups.permissions.help.paragraph.2'])}{' '}
        </Typography>
        <Typography variant="body2" gutterBottom>
          {' '}
          {Tr(T['groups.permissions.help.paragraph.3'])}{' '}
        </Typography>
        <Typography variant="body2" gutterBottom>
          {' '}
          {Tr(T['groups.permissions.help.paragraph.4'])}{' '}
        </Typography>
        <Typography variant="body2" gutterBottom>
          {' '}
          <a
            target="_blank"
            href={generateDocLink(
              version,
              'management_and_operations/users_groups_management/chmod.html#default-acl-rules-for-group'
            )}
            rel="noreferrer"
          >
            {Tr(T['groups.permissions.help.paragraph.link'])}
          </a>
        </Typography>
      </CardContent>
    </Card>
  </Stack>
)

/**
 * Permissions Group configuration.
 *
 * @param {object} props - Step properties
 * @param {string} props.version - Version of ONE
 * @returns {object} Permissions configuration step
 */
const Permissions = ({ version }) => ({
  id: STEP_ID,
  label: T.Permissions,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: () => Content(version),
})

Permissions.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

export default Permissions
