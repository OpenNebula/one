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
import PropTypes from 'prop-types'
import { ADVANCED_PARAMS_FIELDS } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/advancedParams/schema'
import { FormWithSchema } from '@modules/components/Forms'
import { Box, Stack, Divider } from '@mui/material'
import { STEP_ID as EXTRA_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra'

import { Settings as AdvancedIcon } from 'iconoir-react'

import { T } from '@ConstantsModule'

export const TAB_ID = 'advanced'

const Content = () => (
  <Box sx={{ width: '100%', height: '100%' }}>
    <Stack
      key={`inputs-${TAB_ID}`}
      direction="column"
      alignItems="flex-start"
      gap="0.5rem"
      component="form"
      width="100%"
    >
      <FormWithSchema
        cy={TAB_ID}
        legend={T.AdvancedParams}
        id={`${EXTRA_ID}.${TAB_ID}`}
        fields={ADVANCED_PARAMS_FIELDS}
      />
    </Stack>
    <Divider />
  </Box>
)

Content.propTypes = {
  stepId: PropTypes.string,
}

const TAB = {
  id: TAB_ID,
  name: T.AdvancedOptions,
  icon: AdvancedIcon,
  Content,
  getError: (error) => !!error?.[TAB_ID],
}

export default TAB
