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

import { memo, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useParams, useLocation } from 'react-router-dom'

import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Stack,
} from '@mui/material'
import { Menu as MenuIcon } from 'iconoir-react'

import { useAuth } from 'client/features/Auth'
import { useGeneral, useGeneralApi } from 'client/features/General'

import User from 'client/components/Header/User'
import View from 'client/components/Header/View'
import Group from 'client/components/Header/Group'
import Zone from 'client/components/Header/Zone'
import { Translate } from 'client/components/HOC'
import { sentenceCase } from 'client/utils'
import { APPS_WITH_ONE_PREFIX } from 'client/constants'

const Header = memo(({ route: { title, description } = {} }) => {
  const { isOneAdmin } = useAuth()
  const { fixMenu } = useGeneralApi()
  const { appTitle, isBeta, withGroupSwitcher } = useGeneral()

  const params = useParams()
  const { state } = useLocation()

  const appAsSentence = useMemo(() => sentenceCase(appTitle), [appTitle])

  const [ensuredTitle, ensuredDescription] = useMemo(() => {
    if (!title) return []

    const ensure = (label) =>
      typeof label === 'function' ? label(params, state) : label

    return [ensure(title), ensure(description)]
  }, [params, state, title, description])

  return (
    <AppBar data-cy="header" elevation={0} position="absolute">
      <Toolbar>
        <IconButton
          onClick={() => fixMenu(true)}
          edge="start"
          size="small"
          variant="outlined"
          sx={{ display: { lg: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Box
          flexGrow={1}
          ml={2}
          alignItems="baseline"
          display={{ xs: 'none', sm: 'inline-flex' }}
          sx={{ userSelect: 'none' }}
        >
          <Typography variant="h6" data-cy="header-app-title">
            {APPS_WITH_ONE_PREFIX.includes(appTitle) && 'One'}
            <Typography
              variant={'inherit'}
              color="secondary.800"
              component="span"
              sx={{ textTransform: 'capitalize' }}
            >
              {appAsSentence}
            </Typography>
            {isBeta && (
              <Typography
                variant="overline"
                color="primary.contrastText"
                ml="0.5rem"
              >
                {'BETA'}
              </Typography>
            )}
          </Typography>
          <Box
            alignItems="baseline"
            display={{ xs: 'none', md: 'inline-flex' }}
            gap=".5em"
            sx={{
              '&::before': { content: '"|"', ml: '.5em' },
            }}
          >
            {ensuredTitle && (
              <Typography
                noWrap
                variant="subtitle1"
                data-cy="header-title"
                sx={{ color: 'primary.contrastText' }}
              >
                <Translate word={ensuredTitle} />
              </Typography>
            )}
            {ensuredDescription && (
              <Typography
                noWrap
                variant="subtitle2"
                data-cy="header-description"
                sx={{ color: 'text.contrastText' }}
              >
                <Translate word={ensuredDescription} />
              </Typography>
            )}
          </Box>
        </Box>
        <Stack
          direction="row"
          justifyContent="end"
          sx={{ flexGrow: { xs: 1, sm: 0 } }}
        >
          <User />
          <View />
          {!isOneAdmin && withGroupSwitcher && <Group />}
          <Zone />
        </Stack>
      </Toolbar>
    </AppBar>
  )
})

Header.propTypes = {
  route: PropTypes.object,
  scrollContainer: PropTypes.object,
}

Header.displayName = 'Header'

export default Header
