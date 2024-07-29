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
import { Box, Paper, Typography, Divider } from '@mui/material'
import { Translate } from 'client/components/HOC'
import { COMMUNITY_WEBSITE, DOCUMENTATION_WEBSITE, T } from 'client/constants'
import { InfoEmpty, Book, ChatLines } from 'iconoir-react'
import makeStyles from '@mui/styles/makeStyles'

const useStyles = makeStyles((theme) => ({
  title: {
    display: 'flex',
    gap: theme.spacing(1),
  },
  iconSpacing: {
    pl: '1em',
  },
  documentationIcon: {
    fontSize: 'xxx-large',
    color: theme.palette.text.secondary,
  },
  documentationBox: {
    textAlign: 'center',
  },
  links: {
    color: theme.palette.secondary.dark,
    textDecoration: 'none',
  },
}))

/**
 * Section to visit documentation and comunity website.
 *
 * @returns {ReactElement} Settings authentication
 */
const Settings = () => {
  const classes = useStyles()

  return (
    <Paper
      variant="outlined"
      sx={{ overflow: 'auto', py: '1.5em', gridColumn: { md: 'span 2' } }}
    >
      <Box px="1rem">
        <Typography variant="h5" className={classes.title}>
          <InfoEmpty className={classes.iconSpacing} />
          <Translate word={T.AdditionalHelpResources} />
        </Typography>

        <Divider sx={{ my: '1em' }} />

        <Box
          display="grid"
          gap="1em"
          sx={{ gridTemplateColumns: { sm: '1fr', md: '1fr 1fr' } }}
        >
          <Box className={classes.documentationBox}>
            <a
              href={DOCUMENTATION_WEBSITE}
              target="_blank"
              className={classes.links}
              rel="noreferrer"
            >
              <Book className={classes.documentationIcon} />
              <Typography variant="h6">
                <Translate word={T.Documentation} />
              </Typography>
            </a>
          </Box>

          <Box className={classes.documentationBox}>
            <a
              href={COMMUNITY_WEBSITE}
              target="_blank"
              className={classes.links}
              rel="noreferrer"
            >
              <ChatLines className={classes.documentationIcon} />
              <Typography variant="h6">
                <Translate word={T.Community} />
              </Typography>
            </a>
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}

export default Settings
