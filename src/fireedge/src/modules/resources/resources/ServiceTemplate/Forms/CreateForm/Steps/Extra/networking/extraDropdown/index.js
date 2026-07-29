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

import { Stack } from '@mui/material'
import { CollapsiblePanel } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'

import {
  AR,
  SG,
} from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Extra/networking/extraDropdown/sections'

export const SECTION_ID = 'networks_values'

export const ExtraDropdown = ({ networksValues, selectedNetwork }) => (
  <CollapsiblePanel
    title={T.Extra}
    isDefaultCollapsed={
      !Object.values(networksValues?.[selectedNetwork] ?? {})?.flat()?.length
    }
  >
    <Stack direction="column" spacing={2}>
      {[AR, SG].map(({ Section }, idx) => (
        <Section key={`section-${idx}`} selectedNetwork={selectedNetwork} />
      ))}
    </Stack>
  </CollapsiblePanel>
)

export default ExtraDropdown
