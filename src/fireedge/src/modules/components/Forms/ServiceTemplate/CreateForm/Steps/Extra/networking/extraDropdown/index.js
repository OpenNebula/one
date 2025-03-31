/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

import { Legend } from '@modules/components/Forms'
import {
  Stack,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import { T } from '@ConstantsModule'

import {
  AR,
  SG,
} from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking/extraDropdown/sections'

export const SECTION_ID = 'networks_values'

export const ExtraDropdown = ({ networksValues, selectedNetwork }) => (
  <Accordion
    variant="transparent"
    defaultExpanded={
      !!Object.values(networksValues?.[selectedNetwork] ?? {})?.flat()?.length
    }
    TransitionProps={{ unmountOnExit: false }}
    sx={{
      width: '100%',
    }}
  >
    <AccordionSummary>
      <Legend disableGutters title={T.Extra} />
    </AccordionSummary>

    <AccordionDetails>
      <Grid container spacing={4}>
        {[AR, SG].map(({ Section }, idx) => (
          <Grid key={`section-${idx}`} item md={6}>
            <Stack direction="column" spacing={2}>
              <Section selectedNetwork={selectedNetwork} />
            </Stack>
          </Grid>
        ))}
      </Grid>
    </AccordionDetails>
  </Accordion>
)

export default ExtraDropdown
