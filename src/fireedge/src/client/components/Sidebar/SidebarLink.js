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
/* eslint-disable jsdoc/require-jsdoc */
import { memo } from 'react'
import PropTypes from 'prop-types'
import { useHistory, useLocation } from 'react-router-dom'

import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
} from '@mui/material'

import { useGeneralApi } from 'client/features/General'
import { DevTypography } from 'client/components/Typography'
import { Translate } from 'client/components/HOC'

const SidebarLink = memo(
  ({
    title = '',
    path = '/',
    icon: Icon,
    devMode = false,
    isSubItem = false,
  }) => {
    const isUpLg = useMediaQuery((theme) => theme.breakpoints.up('lg'), {
      noSsr: true,
    })

    const history = useHistory()
    const { pathname } = useLocation()
    const { fixMenu } = useGeneralApi()

    const handleClick = () => {
      history.push(path)
      !isUpLg && fixMenu(false)
    }

    return (
      <ListItemButton
        data-cy="main-menu-item"
        onClick={handleClick}
        selected={pathname === path}
        {...(isSubItem && { sx: { pl: 4 } })}
      >
        {Icon && (
          <ListItemIcon>
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
