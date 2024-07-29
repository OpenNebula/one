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
import { ReactElement } from 'react'
import {
  Box,
  Paper,
  Typography,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'

import { Translate } from 'client/components/HOC'
import { SUPPORT_WEBSITE, T } from 'client/constants'

import { Check as CheckIcon } from 'iconoir-react'

const useStyles = makeStyles((theme) => ({
  bullet: {
    paddingRight: theme.spacing(1),
    minWidth: 'auto',
  },
  listItem: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  infoBottom: {
    paddingTop: theme.spacing(1),
    fontWeight: theme.typography.fontWeightBold,
  },
  infoTop: {
    paddingBottom: theme.spacing(1),
  },
  links: {
    color: theme.palette.secondary.dark,
    textDecoration: 'none',
  },
}))

const generateSubscriptionBenefits = (classes) => {
  const subscriptionBenefits = [
    T.DiagnosisResolutionBugFix,
    T.SolveUnexpectedProblems,
    T.GuidanceEnvironment,
    T.AnswerHowToQuestions,
    T.WorkArounds,
    T.AnswerQuestions,
  ]

  return subscriptionBenefits.map((text, index) => (
    <ListItem key={index} className={classes.listItem}>
      <ListItemIcon className={classes.bullet}>
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
const Settings = () => {
  const classes = useStyles()

  return (
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box mt="0.5rem" p="1rem">
        <Typography className={classes.infoTop}>
          <Translate word={T.SupportInformation} />
        </Typography>
        {generateSubscriptionBenefits(classes)}
        <Typography className={classes.infoBottom}>
          <Translate word={T.MoreInformation} />
          <a
            href={SUPPORT_WEBSITE}
            target="_blank"
            rel="noreferrer"
            className={classes.links}
          >
            <Translate word={T.ClickHere.toLowerCase()} />
          </a>
        </Typography>
      </Box>
    </Paper>
  )
}

export default Settings
