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

import { useGeneralApi } from 'client/features/General'
import sidebarStyles from 'client/components/Sidebar/styles'
import { DevTypography } from 'client/components/Typography'

const STATIC_LABEL_PROPS = { 'data-cy': 'main-menu-item-text' }

const SidebarLink = ({ label, path, icon: Icon, devMode, isSubItem }) => {
  const classes = sidebarStyles()
  const isUpLg = useMediaQuery(theme => theme.breakpoints.up('lg'), { noSsr: true })

  const history = useHistory()
  const { pathname } = useLocation()
  const { fixMenu } = useGeneralApi()

  const handleClick = () => {
    history.push(path)
    !isUpLg && fixMenu(false)
  }

  return (
    <ListItem
      button
      component='li'
      onClick={handleClick}
      selected={pathname === path}
      className={clsx({ [classes.subItem]: isSubItem })}
      classes={{ selected: classes.itemSelected }}
      data-cy='main-menu-item'
    >
      {Icon && (
        <ListItemIcon>
          <Icon />
        </ListItemIcon>
      )}
      <ListItemText
        disableTypography={devMode}
        primaryTypographyProps={STATIC_LABEL_PROPS}
        primary={devMode ? <DevTypography label={label} labelProps={STATIC_LABEL_PROPS}/> : label}
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
