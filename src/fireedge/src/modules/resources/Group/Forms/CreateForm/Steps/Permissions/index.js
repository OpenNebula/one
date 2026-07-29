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
import {
  SCHEMA,
  PERMISSIONS_VIEW_FIELDS,
  PERMISSIONS_CREATE_FIELDS,
} from './schema'
import { Stack } from '@mui/material'

export const STEP_ID = 'permissions'

const Content = (version) => (
  <Stack
    display="grid"
    gap="1em"
    sx={{
      gridTemplateColumns: { sm: '1fr', md: '1fr 1fr' },
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
    </div>
    <div>
      <FormWithSchema
        id={STEP_ID}
        cy={`${STEP_ID}`}
        fields={PERMISSIONS_VIEW_FIELDS}
        legend={T['groups.permissions.view.section']}
        legendTooltip={T['groups.permissions.view.section.concept']}
      />
    </div>
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
  documentation: {
    title: T['groups.permissions.help.title'],
    content: [
      T['groups.permissions.help.paragraph.1'],
      T['groups.permissions.help.paragraph.2'],
      T['groups.permissions.help.paragraph.3'],
      T['groups.permissions.help.paragraph.4'],
    ],
    link: 'product/cloud_system_administration/multitenancy/chmod/#default-acl-rules-for-group',
    version,
  },
})

Permissions.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
  version: PropTypes.string,
}

export default Permissions
