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
import { T } from '@ConstantsModule'
import { Box, Paper, useTheme } from '@mui/material'
import { ReactElement, useEffect, useMemo, useState } from 'react'
import { TranslateProvider } from '@ComponentsModule'
import { css } from '@emotion/css'
import { AuthenticationSettings } from '@modules/containers/Settings/Authentication'
import { ConfigurationChangePassword } from '@modules/containers/Settings/ChangePassword'
import { ConfigurationSettings } from '@modules/containers/Settings/ConfigurationUI'
import { LabelSettings } from '@modules/containers/Settings/LabelsSection'
import { LoginSettings } from '@modules/containers/Settings/LoginToken'
import { SettingsMenu } from '@modules/containers/Settings/Menu'
import { ShowbackSettings } from '@modules/containers/Settings/Showback'
import { TfaSettings } from '@modules/containers/Settings/Tfa'
import { Wrapper } from '@modules/containers/Settings/Wrapper'
import {
  Label as LabelsIcon,
  Shield as SecurityIcon,
  Settings as SettingsIcon,
  ReloadWindow as ShowbackIcon,
} from 'iconoir-react'

import { useGeneralApi } from '@FeaturesModule'

const styles = ({ typography }) => ({
  content: css({
    borderRadius: `${typography.pxToRem(24)}`,
  }),
})

const preferences = 'preferences'
const security = 'security'
const showback = 'showback'
const labels = 'labels'

const optionsRestrincted = [showback]

const optionsSettings = {
  [preferences]: {
    icon: SettingsIcon,
    title: T.Preferences,
    component: (
      <Wrapper>
        <ConfigurationSettings />
      </Wrapper>
    ),
  },
  [security]: {
    icon: SecurityIcon,
    title: T.Security,
    component: (
      <Wrapper>
        <ConfigurationChangePassword />
        <AuthenticationSettings />
        <LoginSettings />
        <TfaSettings />
      </Wrapper>
    ),
  },
  [showback]: {
    icon: ShowbackIcon,
    title: T['showback.title'],
    component: (
      <Wrapper>
        <ShowbackSettings />
      </Wrapper>
    ),
  },
  [labels]: {
    icon: LabelsIcon,
    title: T.Labels,
    component: (
      <Wrapper>
        <LabelSettings />
      </Wrapper>
    ),
  },
}

/** @returns {ReactElement} Settings container */
export const Settings = () => {
  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])

  const [selectedOption, setSelectedOption] = useState(preferences)
  const setting = optionsSettings[selectedOption]

  // Delete second title
  const { setSecondTitle } = useGeneralApi()
  useEffect(() => setSecondTitle({}), [])

  return (
    <TranslateProvider>
      <Box
        display="grid"
        gridTemplateColumns={{ sm: '1fr', md: '250px 1fr' }}
        gridAutoRows="auto"
        gap="1em"
        sx={{
          height: {
            sm: 'auto',
            md: '80%',
          },
          flexGrow: 1,
          marginBottom: '1rem',
        }}
      >
        <SettingsMenu
          options={optionsSettings}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          optionsRestrincted={optionsRestrincted}
        />
        <Paper
          className={classes.content}
          sx={{
            overflow: {
              md: 'scroll',
            },
          }}
        >
          {setting.component}
        </Paper>
      </Box>
    </TranslateProvider>
  )
}
