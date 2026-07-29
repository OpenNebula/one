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

import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'

import { AppBar, IconButton, Stack, Toolbar, useTheme } from '@mui/material'
import { Menu as MenuIcon } from 'iconoir-react'
import { useAuth, useGeneral, useGeneralApi } from '@FeaturesModule'
import Group from '@modules/resources/Header/Group'
import View from '@modules/resources/Header/View'
import { styles } from '@modules/resources/Header/styles'

const Header = memo(() => {
  const { isOneAdmin } = useAuth()
  const { fixMenu } = useGeneralApi()
  const { withGroupSwitcher } = useGeneral()

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
        </Stack>
        <Stack direction="row" className={classes.toolbarRight}>
          <View />
          {!isOneAdmin && withGroupSwitcher && <Group />}
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
