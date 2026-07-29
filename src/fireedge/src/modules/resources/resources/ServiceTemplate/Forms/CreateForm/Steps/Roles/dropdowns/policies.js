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
/* eslint-disable react/prop-types */

import { CollapsiblePanel, FormWithSchema } from '@ComponentsV2Module'
import { STEP_ID as ROLES_ID } from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Roles'

import { Stack, Grid } from '@mui/material'
import { T } from '@ConstantsModule'

import { MIN_MAX_FIELDS } from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Roles/dropdowns/sections/minMax'

import {
  ELASTICITY,
  SCHEDULED,
} from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Roles/dropdowns/sections'

export const PoliciesDropdown = ({ roles, selectedRole }) => (
  <CollapsiblePanel
    key={`policies-${roles?.[selectedRole]?.id}`}
    title={T.RoleElasticity}
    summaryProps={{ 'data-cy': 'accordion-role-elasticy' }}
  >
    <Grid container spacing={4}>
      <Grid item md={12}>
        <FormWithSchema
          id={`${ROLES_ID}.${selectedRole}`}
          cy={`${ROLES_ID}`}
          fields={MIN_MAX_FIELDS}
        />
      </Grid>
      {[ELASTICITY, SCHEDULED].map(({ Section }, idx) => (
        <Grid key={`policies-section-${idx}`} item md={12}>
          <Stack direction="row" spacing={1}>
            <Section roles={roles} selectedRole={selectedRole} />
          </Stack>
        </Grid>
      ))}
    </Grid>
  </CollapsiblePanel>
)

export default PoliciesDropdown
