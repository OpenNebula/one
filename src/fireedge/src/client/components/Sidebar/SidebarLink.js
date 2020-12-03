import * as React from 'react'
import PropTypes from 'prop-types'
import { useHistory, useLocation } from 'react-router-dom'
import clsx from 'clsx'

import {
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery
} from '@material-ui/core'

import { useGeneral } from 'client/hooks'
import sidebarStyles from 'client/components/Sidebar/styles'
import { DevTypography } from 'client/components/Typography'

const SidebarLink = ({ label, path, icon: Icon, devMode, isSubItem }) => {
  const classes = sidebarStyles()
  const history = useHistory()
  const { pathname } = useLocation()
  const { fixMenu } = useGeneral()
  const isUpLg = useMediaQuery(theme => theme.breakpoints.up('lg'), { noSsr: true })

  const handleClick = () => {
    history.push(path)
    !isUpLg && fixMenu(false)
  }

  return (
    <ListItem
      button
      onClick={handleClick}
      selected={pathname === path}
      className={clsx({ [classes.subItem]: isSubItem })}
      classes={{ selected: classes.itemSelected }}
    >
      {Icon && (
        <ListItemIcon>
          <Icon />
        </ListItemIcon>
      )}
      <ListItemText
        primary={devMode ? <DevTypography label={label} /> : label}
      />
    </ListItem>
  )
}

SidebarLink.propTypes = {
  label: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  icon: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.node,
    PropTypes.func,
    PropTypes.string,
    PropTypes.symbol,
    PropTypes.object
  ]),
  devMode: PropTypes.bool,
  isSubItem: PropTypes.bool
}

SidebarLink.defaultProps = {
  label: '',
  path: '/',
  icon: undefined,
  devMode: false,
  isSubItem: false
}

SidebarLink.displayName = 'SidebarLink'

export default SidebarLink
