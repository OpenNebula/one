/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
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

import { useGeneral, useGeneralApi } from 'client/features/General'
import sidebarStyles from 'client/components/Sidebar/styles'
import SidebarLink from 'client/components/Sidebar/SidebarLink'
import SidebarCollapseItem from 'client/components/Sidebar/SidebarCollapseItem'
import Logo from 'client/icons/logo'

const Sidebar = memo(({ endpoints }) => {
  const classes = sidebarStyles()
  const isUpLg = useMediaQuery(theme => theme.breakpoints.up('lg'), { noSsr: true })

  const { isFixMenu } = useGeneral()
  const { fixMenu } = useGeneralApi()

  const handleSwapMenu = () => fixMenu(!isFixMenu)

  const SidebarEndpoints = useMemo(
    () =>
      endpoints
        ?.filter(({ sidebar = false }) => sidebar)
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
      anchor='left'
      open={isFixMenu}
    >
      <Box className={classes.header}>
        <Logo
          width='100%'
          height={50}
          withText
          className={classes.svg}
        />
        <IconButton onClick={handleSwapMenu}>
          {isUpLg ? <MenuIcon /> : <CloseIcon />}
        </IconButton>
      </Box>
      <Divider />
      <Box className={classes.menu}>
        <List className={classes.list} disablePadding data-cy='main-menu'>
          {SidebarEndpoints}
        </List>
      </Box>
    </Drawer>
  )
}, (prev, next) => prev.endpoints.length === next.endpoints.length)

Sidebar.propTypes = {
  endpoints: PropTypes.array
}

Sidebar.defaultProps = {
  endpoints: []
}

Sidebar.displayName = 'Sidebar'

export default Sidebar
