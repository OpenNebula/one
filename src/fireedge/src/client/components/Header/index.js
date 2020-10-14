/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

import React from 'react'
import PropTypes from 'prop-types'

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useMediaQuery
} from '@material-ui/core'
import MenuIcon from '@material-ui/icons/Menu'

import useAuth from 'client/hooks/useAuth'
import useGeneral from 'client/hooks/useGeneral'
import User from 'client/components/Header/User'
import Group from 'client/components/Header/Group'
import Zone from 'client/components/Header/Zone'
import headerStyles from 'client/components/Header/styles'

const Header = ({ title }) => {
  const { isOneAdmin } = useAuth()
  const { isFixMenu, fixMenu } = useGeneral()
  const classes = headerStyles()
  const isUpLg = useMediaQuery(theme => theme.breakpoints.up('lg'))

  const handleFixMenu = () => fixMenu(true)

  return React.useMemo(
    () => (
      <AppBar position="absolute" data-cy="header">
        <Toolbar>
          {!isUpLg && (
            <IconButton onClick={handleFixMenu} edge="start" color="inherit">
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            className={classes.title}
            data-cy="header-title"
          >
            {title}
          </Typography>
          <User />
          {!isOneAdmin && <Group />}
          <Zone />
        </Toolbar>
      </AppBar>
    ),
    [isFixMenu, fixMenu, isUpLg, isOneAdmin]
  )
}

Header.propTypes = {
  title: PropTypes.string
}

Header.defaultProps = {
  title: ''
}

export default Header
