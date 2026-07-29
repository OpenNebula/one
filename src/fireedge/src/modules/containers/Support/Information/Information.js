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
import { ReactElement } from 'react'
import {
  Box,
  Paper,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material'
import { Text } from '@ComponentsV2Module'

import {
  SUPPORT_WEBSITE,
  T,
  TEXT_VARIANTS,
  TEXT_WEIGHTS,
} from '@ConstantsModule'

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
        <Text
          variant={TEXT_VARIANTS.BODY_MEDIUM}
          weight={TEXT_WEIGHTS.REGULAR}
          value={text}
        />
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
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box mt="0.5rem" p="1rem">
        <Text
          variant={TEXT_VARIANTS.BODY_MEDIUM}
          weight={TEXT_WEIGHTS.REGULAR}
          value={T.SupportInformation}
          sx={{
            paddingBottom: theme.spacing(1),
          }}
        />
        {generateSubscriptionBenefits()}
        <Box
          sx={{
            paddingTop: theme.spacing(1),
          }}
        >
          <Text
            component="span"
            variant={TEXT_VARIANTS.BODY_MEDIUM}
            weight={TEXT_WEIGHTS.BOLD}
            value={T.MoreInformation}
          />
          <a
            href={SUPPORT_WEBSITE}
            target="_blank"
            rel="noreferrer"
            style={{
              color: theme.palette.primary.dark,
              textDecoration: 'none',
            }}
          >
            <Text
              component="span"
              variant={TEXT_VARIANTS.BODY_MEDIUM}
              weight={TEXT_WEIGHTS.BOLD}
              value={T.ClickHere.toLowerCase()}
            />
          </a>
        </Box>
      </Box>
    </Paper>
  )
}
