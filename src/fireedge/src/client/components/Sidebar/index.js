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

import React, { useMemo, memo } from 'react'
import PropTypes from 'prop-types'

import clsx from 'clsx'
import {
  List,
  Drawer,
  Divider,
  Box,
  IconButton,
  useMediaQuery
} from '@material-ui/core'
import { Menu as MenuIcon, Close as CloseIcon } from '@material-ui/icons'

import { useGeneral } from 'client/hooks'
import sidebarStyles from 'client/components/Sidebar/styles'
import SidebarLink from 'client/components/Sidebar/SidebarLink'
import SidebarCollapseItem from 'client/components/Sidebar/SidebarCollapseItem'
import Logo from 'client/icons/logo'

const Sidebar = memo(({ endpoints }) => {
  const classes = sidebarStyles()
  const { isFixMenu, fixMenu } = useGeneral()
  const isUpLg = useMediaQuery(theme => theme.breakpoints.up('lg'), { noSsr: true })

  const handleSwapMenu = () => fixMenu(!isFixMenu)

  const SidebarEndpoints = useMemo(
    () =>
      endpoints
        ?.filter(({ authenticated, sidebar = false }) => authenticated && sidebar)
        ?.map((endpoint, index) =>
          endpoint.routes ? (
            <SidebarCollapseItem key={`item-${index}`} {...endpoint} />
          ) : (
            <SidebarLink key={`item-${index}`} {...endpoint} />
          )
        ),
    []
  )

  return (
    <Drawer
      variant={'permanent'}
      className={clsx({ [classes.drawerFixed]: isFixMenu })}
      classes={{
        paper: clsx(classes.drawerPaper, {
          [classes.drawerFixed]: isFixMenu
        })
      }}
      anchor="left"
      open={isFixMenu}
    >
      <Box className={classes.header}>
        <Logo
          width="100%"
          height={100}
          withText
          viewBox="0 0 640 640"
          className={classes.svg}
        />
        <IconButton
          className={classes.itemIcon}
          onClick={handleSwapMenu}
        >
          {isUpLg ? <MenuIcon /> : <CloseIcon />}
        </IconButton>
      </Box>
      <Divider />
      <Box className={classes.menu}>
        <List className={classes.list} disablePadding>
          {SidebarEndpoints}
        </List>
      </Box>
    </Drawer>
  )
}, (prev, next) => prev.endpoints === next.endpoints)

Sidebar.propTypes = {
  endpoints: PropTypes.array
}

Sidebar.defaultProps = {
  endpoints: []
}

Sidebar.displayName = 'Sidebar'

export default Sidebar
