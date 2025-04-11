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
import { Box, Paper, Typography, Divider, useTheme } from '@mui/material'
import { Translate, TranslateProvider } from '@ComponentsModule'
import { COMMUNITY_WEBSITE, T } from '@ConstantsModule'
import { InfoEmpty, Book, ChatLines } from 'iconoir-react'
import { generateDocLink } from '@UtilsModule'
import { SystemAPI } from '@FeaturesModule'

/**
 * Section to visit documentation and comunity website.
 *
 * @returns {ReactElement} Settings authentication
 */
export const Settings = () => {
  const theme = useTheme()
  const { data: version } = SystemAPI.useGetOneVersionQuery()

  return (
    <TranslateProvider>
      <Paper
        variant="outlined"
        sx={{ overflow: 'auto', py: '1.5em', gridColumn: { md: 'span 2' } }}
      >
        <Box px="1rem">
          <Typography
            variant="h5"
            sx={{
              display: 'flex',
              gap: theme.spacing(1),
            }}
          >
            <InfoEmpty
              sx={{
                pl: '1em',
              }}
            />
            <Translate word={T.AdditionalHelpResources} />
          </Typography>

          <Divider sx={{ my: '1em' }} />

          <Box
            display="grid"
            gap="1em"
            sx={{ gridTemplateColumns: { sm: '1fr', md: '1fr 1fr' } }}
          >
            <Box
              sx={{
                textAlign: 'center',
              }}
            >
              <a
                href={generateDocLink(version, '')}
                target="_blank"
                style={{
                  color: theme.palette.primary.dark,
                  textDecoration: 'none',
                }}
                rel="noreferrer"
              >
                <Book
                  sx={{
                    fontSize: 'xxx-large',
                    color: theme.palette.text.secondary,
                  }}
                />
                <Typography variant="h6">
                  <Translate word={T.Documentation} />
                </Typography>
              </a>
            </Box>

            <Box
              sx={{
                textAlign: 'center',
              }}
            >
              <a
                href={COMMUNITY_WEBSITE}
                target="_blank"
                style={{
                  color: theme.palette.primary.dark,
                  textDecoration: 'none',
                }}
                rel="noreferrer"
              >
                <ChatLines
                  sx={{
                    fontSize: 'xxx-large',
                    color: theme.palette.text.secondary,
                  }}
                />
                <Typography variant="h6">
                  <Translate word={T.Community} />
                </Typography>
              </a>
            </Box>
          </Box>
        </Box>
      </Paper>
    </TranslateProvider>
  )
}
