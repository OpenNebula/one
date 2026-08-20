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
import { Box, List, Collapse, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { renderIcon } from '@UtilsModule'
import {
  NavArrowRight as ExpandIcon,
  NavArrowDown as CollapseIcon,
} from 'iconoir-react'
import { matchPath, useHistory, useLocation } from 'react-router-dom'
import { useGeneralApi } from '@FeaturesModule'
import { useTranslation } from '@ProvidersModule'

const isRouteSelected = (pathname, path, exact = true) =>
  !!path && !!matchPath(pathname, { path, exact })

const hasSelectedRoute = (pathname, routes = []) =>
  routes.some(({ path, routes: childRoutes }) => {
    const hasChildren = childRoutes?.length > 0

    return (
      isRouteSelected(pathname, path, hasChildren) ||
      hasSelectedRoute(pathname, childRoutes)
    )
  })

/**
 * @param {object} root0 - Props
 * @param {string} root0.title - Item title
 * @param {Function|object} root0.icon - Item icon
 * @param {Array} root0.routes - Child routes
 * @param {string} root0.path - Item path
 * @param {boolean} root0.isExpanded - Sidebar expanded state
 * @param {number} root0.depth - Item nesting depth
 * @returns {object} Sidebar item
 */
export const SidebarItem = ({
  title,
  icon,
  routes,
  path,
  isExpanded,
  depth = 0,
}) => {
  const { pathname } = useLocation()
  const hasChildren = routes?.length > 0
  const isSelected = isRouteSelected(pathname, path, hasChildren)
  const hasSelectedChild = useMemo(
    () => hasSelectedRoute(pathname, routes),
    [pathname, routes]
  )
  const isActive = isSelected || hasSelectedChild
  const shouldRenderOpen = hasChildren && isActive
  const [open, setOpen] = useState(() => shouldRenderOpen)
  const history = useHistory()
  const { fixMenu } = useGeneralApi()
  const { translate } = useTranslation()

  useEffect(() => {
    if (isExpanded && shouldRenderOpen) {
      setOpen(true)
    }
  }, [isExpanded, shouldRenderOpen])

  const handleNavigate = () => {
    history.push(path)
    fixMenu(false)
  }

  const dataCy = title?.toLocaleLowerCase()
  const itemDataCy = hasChildren ? dataCy : 'main-menu-item'

  return (
    <Box
      className={`sidebar-item ${
        depth === 0 || hasChildren ? 'parent' : 'child'
      } ${isActive ? 'active' : ''} ${isExpanded ? 'expanded' : ''}`}
    >
      <Box
        data-cy={itemDataCy}
        onClick={() => (hasChildren ? setOpen((o) => !o) : handleNavigate())}
        className={`container ${isSelected ? 'selected' : ''}`}
      >
        {depth === 0 &&
          renderIcon(icon, { className: 'icon', key: 'sidebar-icon' })}
        {isExpanded && (
          <Typography className="title" data-cy="main-menu-item-text">
            {translate(title)}
          </Typography>
        )}
        {isExpanded &&
          hasChildren &&
          renderIcon(open ? CollapseIcon : ExpandIcon, {
            className: 'icon',
            key: 'sidebar-toggle',
          })}
      </Box>

      {isExpanded && hasChildren && (
        <Collapse in={open} timeout={'auto'}>
          <List className="collapsible-list">
            {routes.map((route) => (
              <SidebarItem
                key={route.path}
                {...route}
                isExpanded={isExpanded}
                depth={depth + 1}
              />
            ))}
          </List>
        </Collapse>
      )}
    </Box>
  )
}

SidebarItem.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.oneOfType([PropTypes.elementType, PropTypes.object]),
  routes: PropTypes.array,
  path: PropTypes.string,
  isExpanded: PropTypes.bool,
  depth: PropTypes.number,
}
