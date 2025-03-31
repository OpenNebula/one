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

import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'

import {
  AppBar,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material'
import { Menu as MenuIcon } from 'iconoir-react'
import { useAuth, useGeneral, useGeneralApi } from '@FeaturesModule'
import Group from '@modules/components/Header/Group'
import User from '@modules/components/Header/User'
import View from '@modules/components/Header/View'
import Zone from '@modules/components/Header/Zone'
import ThemeSwitchComponent from '@modules/components/Header/ThemeSwitch'
import { sentenceCase } from '@UtilsModule'
import { styles } from '@modules/components/Header/styles'

const Header = memo(() => {
  const { isOneAdmin } = useAuth()
  const { fixMenu } = useGeneralApi()
  const { appTitle, isBeta, withGroupSwitcher } = useGeneral()

  const appAsSentence = useMemo(() => sentenceCase(appTitle), [appTitle])

  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])

  return (
    <AppBar
      data-cy="header"
      elevation={0}
      position="absolute"
      className={classes.header}
    >
      <Toolbar className={classes.toolbar}>
        <Stack
          direction="row"
          className={classes.toolbarLeft}
          alignItems="flex-end"
        >
          <IconButton
            onClick={() => fixMenu(true)}
            edge="start"
            size="small"
            variant="outlined"
            sx={{ display: { lg: 'none' }, paddingLeft: '1.5rem' }}
          >
            <MenuIcon />
          </IconButton>

          <Typography className={classes.title}>{appAsSentence}</Typography>

          {isBeta && <Typography className={classes.text}>{'BETA'}</Typography>}
        </Stack>
        <Stack direction="row" className={classes.toolbarRight}>
          <ThemeSwitchComponent sx={{ m: 1 }} />
          <View />
          {!isOneAdmin && withGroupSwitcher && <Group />}
          <Zone />
          <User />
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
