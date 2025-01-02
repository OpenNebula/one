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
import { Box, Divider, Typography } from '@mui/material'
import { ReactElement } from 'react'

import { Translate, TranslateProvider } from '@ComponentsModule'
import { T } from '@ConstantsModule'

import { AuthenticationSettings } from '@modules/containers/Settings/Authentication'
import { ConfigurationSettings } from '@modules/containers/Settings/ConfigurationUI'
import { LabelSettings } from '@modules/containers/Settings/LabelsSection'
import { LoginSettings } from '@modules/containers/Settings/LoginToken'
import { ShowbackSettings } from '@modules/containers/Settings/Showback'

import { TfaSettings } from '@modules/containers/Settings/Tfa'

import { useSystemData } from '@FeaturesModule'

/** @returns {ReactElement} Settings container */
export const Settings = () => {
  const { adminGroup } = useSystemData()

  return (
    <>
      <TranslateProvider>
        <Typography variant="h5">
          <Translate word={T.Settings} />
        </Typography>

        <Divider sx={{ my: '1em' }} />

        <Box
          display="grid"
          gridTemplateColumns={{ sm: '1fr', md: 'repeat(2, minmax(49%, 1fr))' }}
          gridAutoRows="auto"
          gap="1em"
        >
          <ConfigurationSettings />
          <LabelSettings />
          <AuthenticationSettings />
          {adminGroup ? <ShowbackSettings /> : null}
          <LoginSettings />
          <TfaSettings />
        </Box>
      </TranslateProvider>
    </>
  )
}
