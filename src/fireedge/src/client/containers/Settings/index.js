/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement } from 'react'
import { Typography, Divider, Box } from '@mui/material'

import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

import ConfigurationUISection from 'client/containers/Settings/ConfigurationUI'
import AuthenticationSection from 'client/containers/Settings/Authentication'
import LabelsSection from 'client/containers/Settings/LabelsSection'

/** @returns {ReactElement} Settings container */
const Settings = () => (
  <>
    <Typography variant="h5">
      <Translate word={T.Settings} />
    </Typography>

    <Divider sx={{ my: '1em' }} />

    <Box
      display="grid"
      gridTemplateColumns={{ sm: '1fr', md: 'repeat(2, minmax(49%, 1fr))' }}
      gridTemplateRows="minmax(0, 18em)"
      gap="1em"
    >
      <ConfigurationUISection />
      <LabelsSection />
      <AuthenticationSection />
    </Box>
  </>
)

export default Settings
