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
import { memo, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useHistory, useLocation } from 'react-router-dom'

import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material'

import { useGeneralApi } from '@FeaturesModule'
import { DevTypography } from '@modules/components/Typography'
import { Translate } from '@modules/components/HOC'
import clsx from 'clsx'
import sidebarStyles from '@modules/components/Sidebar/styles'

const SidebarLink = memo(
  ({
    title = '',
    path = '/',
    icon: Icon,
    devMode = false,
    isSubItem = false,
  }) => {
    const isUpLg = useMediaQuery(
      (themeSidebar) => themeSidebar.breakpoints.up('lg'),
      {
        noSsr: true,
      }
    )

    const history = useHistory()
    const { pathname } = useLocation()
    const { fixMenu } = useGeneralApi()

    const handleClick = () => {
      history.push(path)
      !isUpLg && fixMenu(false)
    }

    const theme = useTheme()
    const classes = useMemo(() => sidebarStyles(theme), [theme])

    return (
      <ListItemButton
        data-cy="main-menu-item"
        className={clsx(
          classes.item,
          classes.itemLink,
          isSubItem && classes.subItem
        )}
        onClick={handleClick}
        selected={pathname === path}
        {...(isSubItem && { sx: { pl: 4 } })}
      >
        {Icon && (
          <ListItemIcon className={classes.itemIcon}>
            <Icon />
          </ListItemIcon>
        )}
        <ListItemText
          primary={<Translate word={title} />}
          primaryTypographyProps={{
            ...(devMode && { component: DevTypography }),
            'data-cy': 'main-menu-item-text',
            variant: 'body1',
          }}
          className={clsx('itemText', classes.itemPepe)}
        />
      </ListItemButton>
    )
  }
)

SidebarLink.propTypes = {
  title: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  icon: PropTypes.any,
  devMode: PropTypes.bool,
  isSubItem: PropTypes.bool,
}

SidebarLink.displayName = 'SidebarLink'

export default SidebarLink
