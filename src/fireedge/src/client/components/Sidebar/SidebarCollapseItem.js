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
  icon: PropTypes.node,
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
