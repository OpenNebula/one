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
import { useEffect, useState, useMemo, ReactElement } from 'react'
import PropTypes from 'prop-types'
import { useLocation } from 'react-router-dom'
import clsx from 'clsx'

import {
  List,
  Collapse,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  useMediaQuery,
} from '@mui/material'

import { Minus as CollapseIcon, Plus as ExpandMoreIcon } from 'iconoir-react'

import { useGeneral } from 'client/features/General'
import SidebarLink from 'client/components/Sidebar/SidebarLink'
import sidebarStyles from 'client/components/Sidebar/styles'
import { Translate } from 'client/components/HOC'

/**
 * Renders nested list options for sidebar.
 *
 * @param {object} props - Props
 * @param {string} props.title - Title
 * @param {object[]} props.routes - Nested list of routes
 * @param {ReactElement} props.icon - Icon
 * @returns {ReactElement} Sidebar option that includes other list of routes
 */
const SidebarCollapseItem = ({ title = '', routes = [], icon: Icon }) => {
  const classes = sidebarStyles()
  const { pathname } = useLocation()
  const { isFixMenu } = useGeneral()
  const isUpLg = useMediaQuery((theme) => theme.breakpoints.up('lg'))
  const [expanded, setExpanded] = useState(() => false)

  const hasRouteSelected = useMemo(
    () => routes.some(({ path }) => pathname === path),
    [routes, pathname]
  )

  const handleExpand = () => setExpanded(!expanded)

  useEffect(() => {
    // force expanded
    !expanded && hasRouteSelected && setExpanded(true)
  }, [expanded, hasRouteSelected])

  return (
    <>
      <ListItemButton
        className={classes.parentSubItem}
        onClick={handleExpand}
        selected={hasRouteSelected}
      >
        {Icon && (
          <ListItemIcon>
            <Icon />
          </ListItemIcon>
        )}
        <ListItemText
          data-cy={title.toLocaleLowerCase()}
          primary={<Translate word={title} />}
          {...(expanded && { className: 'open' })}
          primaryTypographyProps={{ variant: 'body1' }}
        />
        {expanded ? <CollapseIcon /> : <ExpandMoreIcon />}
      </ListItemButton>
      <Collapse
        in={expanded}
        timeout="auto"
        unmountOnExit
        className={clsx({ [classes.subItemWrapper]: isUpLg && !isFixMenu })}
      >
        <List component="div" disablePadding>
          {routes
            ?.filter(({ sidebar = false }) => sidebar)
            ?.map((subItem, index) => (
              <SidebarLink key={`subitem-${index}`} isSubItem {...subItem} />
            ))}
        </List>
      </Collapse>
    </>
  )
}

SidebarCollapseItem.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.oneOfType([PropTypes.node, PropTypes.object]),
  routes: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
      path: PropTypes.string,
    })
  ),
}

export default SidebarCollapseItem
