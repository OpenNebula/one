/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import React, { useState } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

import {
  List,
  Icon as MIcon,
  Collapse,
  ListItem,
  ListItemText,
  ListItemIcon,
  useMediaQuery
} from '@material-ui/core'
import { NavArrowRight as CollapseIcon, NavArrowDown as ExpandMoreIcon } from 'iconoir-react'

import { useGeneral } from 'client/features/General'
import SidebarLink from 'client/components/Sidebar/SidebarLink'
import sidebarStyles from 'client/components/Sidebar/styles'

const SidebarCollapseItem = ({ label, routes, icon: Icon }) => {
  const classes = sidebarStyles()
  const { isFixMenu } = useGeneral()
  const [expanded, setExpanded] = useState(false)
  const isUpLg = useMediaQuery(theme => theme.breakpoints.up('lg'))

  const handleExpand = () => setExpanded(!expanded)

  return (
    <>
      <ListItem button onClick={handleExpand}>
        {Icon && (
          <ListItemIcon>
            <Icon />
          </ListItemIcon>
        )}
        <ListItemText
          className={classes.itemText}
          data-max-label={label}
          data-min-label={label.slice(0, 3)}
        />
        <MIcon className={clsx({ [classes.expandIcon]: isUpLg && !isFixMenu })}>
          {expanded ? <CollapseIcon /> : <ExpandMoreIcon />}
        </MIcon>
      </ListItem>
      {routes?.map((subItem, index) => (
        <Collapse
          key={`subitem-${index}`}
          in={expanded}
          timeout='auto'
          unmountOnExit
          className={clsx({ [classes.subItemWrapper]: isUpLg && !isFixMenu })}
        >
          <List component='div' disablePadding>
            <SidebarLink {...subItem} isSubItem />
          </List>
        </Collapse>
      ))}
    </>
  )
}

SidebarCollapseItem.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.object
  ]),
  routes: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      path: PropTypes.string
    })
  )
}

SidebarCollapseItem.defaultProps = {
  label: '',
  icon: null,
  routes: []
}

export default SidebarCollapseItem
