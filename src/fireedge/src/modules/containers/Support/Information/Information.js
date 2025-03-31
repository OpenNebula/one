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
import { ReactElement } from 'react'
import {
  Box,
  Paper,
  Typography,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material'

import { Translate, TranslateProvider } from '@ComponentsModule'
import { SUPPORT_WEBSITE, T } from '@ConstantsModule'

import { Check as CheckIcon } from 'iconoir-react'

const generateSubscriptionBenefits = () => {
  const subscriptionBenefits = [
    T.DiagnosisResolutionBugFix,
    T.SolveUnexpectedProblems,
    T.GuidanceEnvironment,
    T.AnswerHowToQuestions,
    T.WorkArounds,
    T.AnswerQuestions,
  ]

  return subscriptionBenefits.map((text, index) => (
    <ListItem
      key={index}
      sx={{
        paddingTop: 0,
        paddingBottom: 0,
      }}
    >
      <ListItemIcon
        sx={{
          paddingRight: (theme) => theme.spacing(1),
          minWidth: 'auto',
        }}
      >
        <CheckIcon />
      </ListItemIcon>
      <ListItemText>
        <Typography>
          <Translate word={text} />
        </Typography>
      </ListItemText>
    </ListItem>
  ))
}

/**
 * Section to change labels.
 *
 * @returns {ReactElement} Settings configuration UI
 */
export const Settings = () => {
  const theme = useTheme()

  return (
    <TranslateProvider>
      <Paper
        variant="outlined"
        sx={{ display: 'flex', flexDirection: 'column' }}
      >
        <Box mt="0.5rem" p="1rem">
          <Typography
            sx={{
              paddingBottom: theme.spacing(1),
            }}
          >
            <Translate word={T.SupportInformation} />
          </Typography>
          {generateSubscriptionBenefits()}
          <Typography
            sx={{
              paddingTop: theme.spacing(1),
              fontWeight: theme.typography.fontWeightBold,
            }}
          >
            <Translate word={T.MoreInformation} />
            <a
              href={SUPPORT_WEBSITE}
              target="_blank"
              rel="noreferrer"
              style={{
                color: theme.palette.primary.dark,
                textDecoration: 'none',
              }}
            >
              <Translate word={T.ClickHere.toLowerCase()} />
            </a>
          </Typography>
        </Box>
      </Paper>
    </TranslateProvider>
  )
}
