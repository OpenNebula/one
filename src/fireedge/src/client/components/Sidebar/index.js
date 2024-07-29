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
/* eslint-disable jsdoc/require-jsdoc */
import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { useLocation, matchPath } from 'react-router'

import clsx from 'clsx'
import {
  List,
  Drawer,
  Divider,
  Box,
  IconButton,
  useMediaQuery,
} from '@mui/material'

import {
  Menu as MenuIcon,
  NavArrowLeft as ArrowLeftIcon,
  Cancel as CloseIcon,
} from 'iconoir-react'

import { useGeneral, useGeneralApi } from 'client/features/General'
import { OpenNebulaLogo } from 'client/components/Icons'

import sidebarStyles from 'client/components/Sidebar/styles'
import SidebarLink from 'client/components/Sidebar/SidebarLink'
import SidebarCollapseItem from 'client/components/Sidebar/SidebarCollapseItem'

const Sidebar = ({ endpoints }) => {
  const { pathname } = useLocation()
  const classes = sidebarStyles()
  const isUpLg = useMediaQuery((theme) => theme.breakpoints.up('lg'), {
    noSsr: true,
  })

  const { isFixMenu } = useGeneral()
  const { fixMenu } = useGeneralApi()

  const handleSwapMenu = () => fixMenu(!isFixMenu)

  const SidebarEndpoints = useMemo(
    () =>
      endpoints
        ?.filter(
          ({ sidebar = false, routes = [] }) =>
            sidebar || routes.some((subRoute) => subRoute?.sidebar)
        )
        ?.sort(({ position: posA = 1 }, { position: posB = 1 }) => posB - posA)
        ?.map((endpoint, index) =>
          endpoint.routes ? (
            <SidebarCollapseItem key={`item-${index}`} {...endpoint} />
          ) : (
            <SidebarLink key={`item-${index}`} {...endpoint} />
          )
        ),
    [endpoints]
  )

  const isDisabledSidebar = useMemo(() => {
    const endpoint = endpoints.find(({ path }) =>
      matchPath(pathname, { path, exact: true })
    )

    return endpoint?.disableLayout
  }, [pathname])

  if (isDisabledSidebar) {
    return null
  }

  return (
    <Drawer
      variant="permanent"
      classes={{
        paper: clsx(classes.drawerPaper, {
          [classes.drawerFixed]: isFixMenu,
        }),
      }}
      anchor="left"
      open={isFixMenu}
      PaperProps={{ 'data-cy': 'sidebar' }}
    >
      <Box className={classes.header}>
        <OpenNebulaLogo
          width="100%"
          height={50}
          withText
          className={classes.logo}
          disabledBetaText
        />
        {!isUpLg || isFixMenu ? (
          <IconButton onClick={handleSwapMenu}>
            {!isUpLg ? <CloseIcon /> : <ArrowLeftIcon />}
          </IconButton>
        ) : (
          <IconButton onClick={handleSwapMenu}>
            <MenuIcon />
          </IconButton>
        )}
      </Box>
      <Divider />
      <Box className={classes.menu}>
        <List data-cy="main-menu">{SidebarEndpoints}</List>
      </Box>
    </Drawer>
  )
}

Sidebar.propTypes = {
  endpoints: PropTypes.array,
}

Sidebar.defaultProps = {
  endpoints: [],
}

Sidebar.displayName = 'Sidebar'

export default Sidebar
