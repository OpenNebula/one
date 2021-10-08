/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { useMemo } from 'react'
import PropTypes from 'prop-types'

import { AppBar, Box, Toolbar, Typography, IconButton, Stack } from '@mui/material'
import { Menu as MenuIcon } from 'iconoir-react'

import { useAuth } from 'client/features/Auth'
import { useGeneral, useGeneralApi } from 'client/features/General'

import User from 'client/components/Header/User'
import View from 'client/components/Header/View'
import Group from 'client/components/Header/Group'
import Zone from 'client/components/Header/Zone'
import { sentenceCase } from 'client/utils'

const Header = () => {
  const { isOneAdmin } = useAuth()
  const { fixMenu } = useGeneralApi()
  const { appTitle, title, isBeta } = useGeneral()
  const appAsSentence = useMemo(() => sentenceCase(appTitle), [appTitle])

  return (
    <AppBar data-cy='header' elevation={0} position='absolute'>
      <Toolbar>
        <IconButton
          onClick={() => fixMenu(true)}
          edge='start'
          size='small'
          variant='outlined'
          sx={{ display: { lg: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Box
          flexGrow={1}
          ml={2}
          sx={{
            display: { xs: 'none', sm: 'inline-flex' },
            userSelect: 'none'
          }}
        >
          <Typography
            variant='h6'
            data-cy='header-app-title'
          >
            {'One'}
            <Typography
              variant={'inherit'}
              color='secondary.800'
              component='span'
              sx={{ textTransform: 'capitalize' }}
            >
              {appAsSentence}
            </Typography>
            {isBeta && (
              <Typography
                variant='overline'
                color='primary.contrastText'
                ml='0.5rem'
              >
                {'BETA'}
              </Typography>
            )}
          </Typography>
          <Typography
            variant='h6'
            data-cy='header-description'
            sx={{
              display: { xs: 'none', xl: 'block' },
              '&::before': {
                content: '"|"',
                margin: '0.5em',
                color: 'primary.contrastText'
              }
            }}
          >
            {title}
          </Typography>
        </Box>
        <Stack direction='row' flexGrow={1} justifyContent='end'>
          <User />
          <View />
          {!isOneAdmin && <Group />}
          <Zone />
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

Header.propTypes = {
  scrollContainer: PropTypes.object
}

Header.defaultProps = {
  scrollContainer: null
}

export default Header
