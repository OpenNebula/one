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

import { forwardRef, useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { Box, Drawer } from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/Sidebar/Default/styles'
import { SidebarItem } from '@modules/componentsv2/primitives/Sidebar/Default/sidebarItem'
import { OpenNebulaLogo } from '@modules/componentsv2/composed/OpenNebulaLogo'
import { SidebarUserMenu } from '@modules/componentsv2/primitives/Sidebar/Default/userMenu'
import { SidebarRoleMenu } from '@modules/componentsv2/primitives/Sidebar/Default/roleMenu'
import {
  LayoutLeft as OpenMenuIcon,
  NavArrowLeft as CollapseMenuIcon,
} from 'iconoir-react'
import { Button } from '@modules/componentsv2/primitives/Buttons'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'
import { Link as RouterLink } from 'react-router-dom'

const SIDEBAR_FIXED_STORAGE_KEY = 'fireedge.sidebar.fixed'

/**
 * Sidebar input component .
 */
export const Sidebar = forwardRef(
  ({ isOpen = false, endpoints = [], ...opts }, ref) => {
    const { translate } = useTranslation()
    const [hovered, setHovered] = useState(false)
    const [fixedMenu, setFixedMenu] = useState(() => {
      try {
        if (typeof window === 'undefined') return false

        return window.localStorage.getItem(SIDEBAR_FIXED_STORAGE_KEY) === 'true'
      } catch {
        return false
      }
    })
    const isFixedMenu = fixedMenu
    const open = isOpen || hovered || isFixedMenu
    const internalRef = useRef()
    const headerRef = useRef()

    const handleFixedMenuToggle = () => {
      setFixedMenu((prev) => {
        const nextFixedMenu = !prev

        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(
              SIDEBAR_FIXED_STORAGE_KEY,
              String(nextFixedMenu)
            )
          }
        } catch {}

        return nextFixedMenu
      })
    }

    useEffect(() => {
      if (!internalRef.current) return
      const observer = new ResizeObserver(([entry]) => {
        document.documentElement.style.setProperty(
          '--sidebar-width',
          `${entry.contentRect.width}px`
        )
      })
      observer.observe(internalRef.current)

      return () => observer.disconnect()
    }, [])

    useEffect(() => {
      const header = headerRef.current
      if (!header) return

      const observer = new ResizeObserver(() => {
        const height = header.getBoundingClientRect().height

        document.documentElement.style.setProperty(
          '--sidebar-header-height',
          `${height}px`
        )
      })

      observer.observe(header)

      return () => observer.disconnect()
    }, [])

    const filterEndpoints = (routes) =>
      routes?.reduce((acc, r) => {
        const filteredRoutes = filterEndpoints(r.routes)
        if (r.sidebar === true || filteredRoutes?.length > 0) {
          acc.push({ ...r, routes: filteredRoutes })
        }

        return acc
      }, [])

    const fEndpoints = filterEndpoints(endpoints)?.sort(
      ({ position: posA = 1 }, { position: posB = 1 }) => posB - posA
    )

    return (
      <Box
        sx={(theme) =>
          getStyles({
            theme,
            isOpen: open,
          })
        }
        ref={ref}
        onMouseLeave={() => setHovered(false)}
        data-cy="sidebar"
        {...opts}
      >
        <Drawer
          className="sidebar"
          variant="permanent"
          anchor="left"
          open={open}
          PaperProps={{
            ref: internalRef,
            'data-cy': 'sidebar-paper',
          }}
          {...opts}
        >
          <Box
            className="sidebar-header"
            ref={headerRef}
            onMouseEnter={() => setHovered(true)}
          >
            <Box
              className="sidebar-header-logo"
              component={RouterLink}
              to={`/${RESOURCE_NAMES.DASHBOARD}`}
              aria-label={T.Dashboard}
            >
              <OpenNebulaLogo withText={open} />
            </Box>
            {open && (
              <Box className="sidebar-fixed-toggle-container">
                <Button
                  className="sidebar-toggle-button"
                  dataCy="sidebar-fixed-toggle-button"
                  onClick={handleFixedMenuToggle}
                  aria-label={translate(T.ToggleFixedMenu)}
                  iconOnly={
                    isFixedMenu ? <CollapseMenuIcon /> : <OpenMenuIcon />
                  }
                  type="transparent"
                />
              </Box>
            )}
          </Box>
          <Box className="sidebar-content">
            <SidebarRoleMenu isExpanded={open} />
            <Box
              className="sidebar-content-section"
              onMouseEnter={() => setHovered(true)}
            >
              <Box className="sidebar-content-section-list">
                {fEndpoints?.map((endpoint, idx) => (
                  <SidebarItem
                    key={`endpoint-${idx}`}
                    {...endpoint}
                    isExpanded={open}
                  />
                ))}
              </Box>
            </Box>
          </Box>
          <Box className="sidebar-footer">
            <SidebarUserMenu isExpanded={open} />
          </Box>
        </Drawer>
      </Box>
    )
  }
)

Sidebar.propTypes = {
  isOpen: PropTypes.bool,
  endpoints: PropTypes.arrayOf(PropTypes.object),
}

Sidebar.displayName = 'Sidebar'
