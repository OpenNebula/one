import React, { useState } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

import {
  List,
  Collapse,
  ListItem,
  ListItemText,
  ListItemIcon,
  useMediaQuery
} from '@material-ui/core'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

import { useGeneral } from 'client/hooks'
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
        <ListItemText primary={label} />
        {expanded ? (
          <ExpandLessIcon
            className={clsx({ [classes.expandIcon]: isUpLg && !isFixMenu })}
          />
        ) : (
          <ExpandMoreIcon
            className={clsx({ [classes.expandIcon]: isUpLg && !isFixMenu })}
          />
        )}
      </ListItem>
      {routes?.map((subItem, index) => (
        <Collapse
          key={`subitem-${index}`}
          in={expanded}
          timeout="auto"
          unmountOnExit
          className={clsx({ [classes.subItemWrapper]: isUpLg && !isFixMenu })}
        >
          <List component="div" disablePadding>
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
