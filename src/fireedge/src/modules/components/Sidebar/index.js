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
/* eslint-disable jsdoc/require-jsdoc */
import {
  Box,
  Drawer,
  IconButton,
  List,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import PropTypes from 'prop-types'
import { useEffect, useMemo, useState } from 'react'
import { matchPath, useLocation } from 'react-router'

import clsx from 'clsx'

import {
  NavArrowLeft as ArrowLeftIcon,
  Cancel as CloseIcon,
  Menu as MenuIcon,
} from 'iconoir-react'

import { useAuth, useGeneral, useGeneralApi } from '@FeaturesModule'
import { OpenNebulaLogo } from '@modules/components/Icons'

import SidebarCollapseItem from '@modules/components/Sidebar/SidebarCollapseItem'
import SidebarLink from '@modules/components/Sidebar/SidebarLink'
import sidebarStyles from '@modules/components/Sidebar/styles'

const Sidebar = ({ endpoints }) => {
  const theme = useTheme()
  const { pathname } = useLocation()

  const isUpLg = useMediaQuery(theme.breakpoints.up('lg'), {
    noSsr: true,
  })

  const { isFixMenu } = useGeneral()
  const { fixMenu } = useGeneralApi()
  const { settings: { FIREEDGE: fireedge = {} } = {} } = useAuth()

  useEffect(() => {
    fireedge?.SIDEBAR === 'true' && fixMenu(true)
  }, [fireedge])

  // To let the component knows that the mouse is hover or not
  const [isHovered, setIsHovered] = useState(false)

  const classes = useMemo(
    () => sidebarStyles(theme, isFixMenu),
    [theme, isFixMenu]
  )

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
      PaperProps={{
        'data-cy': 'sidebar',
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      }}
    >
      <Box
        className={classes.header}
        sx={{ paddingLeft: isHovered || isFixMenu ? '0.75rem' : '0' }}
      >
        <OpenNebulaLogo
          width="100px"
          height={isHovered || isFixMenu ? '40px' : '30px'}
          withText={isHovered || isFixMenu}
          className={clsx(classes.logo, 'logoPadding')}
          disabledBetaText
        />
        {!isUpLg || isFixMenu ? (
          <IconButton onClick={handleSwapMenu}>
            {!isUpLg ? (
              <CloseIcon className={classes.logoAux} />
            ) : (
              <ArrowLeftIcon className={classes.logoAux} />
            )}
          </IconButton>
        ) : (
          <IconButton onClick={handleSwapMenu} className={'headerButton'}>
            <MenuIcon className={classes.logoAux} />
          </IconButton>
        )}
      </Box>

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
