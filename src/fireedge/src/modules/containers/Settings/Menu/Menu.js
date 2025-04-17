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

import { css } from '@emotion/css'
import { useSystemData } from '@FeaturesModule'
import LogOut from '@modules/containers/Settings/Menu/LogOut'
import ProfileImage from '@modules/containers/Settings/Menu/ProfileImage'
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  useTheme,
} from '@mui/material'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import { ReactElement, useMemo } from 'react'

const styles = ({ typography, palette }) => ({
  root: css({
    borderRadius: `${typography.pxToRem(24)}`,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  }),
  menu: css({
    flexGrow: 1,
    overflow: 'auto',
  }),
  listItem: css({
    padding: `0 0 0 ${typography.pxToRem(16)}`,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'transparent',
    },
  }),
  listItemContainer: css({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: typography.pxToRem(12),
  }),
  listItemSelected: css({
    background: palette.sidebar.backgroundColorHover,
    borderRadius: `3rem 0 0 ${typography.pxToRem(48)}`,
    borderRight: `${typography.pxToRem(3)} solid ${palette.info.dark}`,
  }),
  icon: css({ minWidth: typography.pxToRem(32) }),
})

/**
 * Setting Menu.
 *
 * @param {object} props - Props
 * @param {object} props.options - Options
 * @param {string} props.selectedOption - Selected option
 * @param {Function} props.setSelectedOption - Set selected option
 * @param {any[]} props.optionsRestrincted - Options restricted
 * @returns {ReactElement} Settings menu
 */
const Menu = ({
  options = {},
  selectedOption = '',
  setSelectedOption = () => undefined,
  optionsRestrincted = [],
}) => {
  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])

  const { adminGroup } = useSystemData()
  const entriesArray = useMemo(
    () =>
      Object.entries(options)
        .map(([key, value]) => [key, value])
        .filter(([key]) => adminGroup || !optionsRestrincted.includes(key)),
    [options]
  )

  return (
    <Paper className={classes.root}>
      <ProfileImage />
      <List className={classes.menu} data-cy="setting-menu">
        {entriesArray.map(([key, value], index) => (
          <ListItem
            className={classes.listItem}
            key={index}
            data-cy={key}
            onClick={() => setSelectedOption(key)}
            data-cy={`setting-${value?.title?.toLocaleLowerCase()}`}
          >
            <Box
              className={
                selectedOption === key
                  ? clsx(classes.listItemContainer, classes.listItemSelected)
                  : classes.listItemContainer
              }
            >
              {value.icon && (
                <ListItemIcon className={classes.icon}>
                  <value.icon />
                </ListItemIcon>
              )}
              <ListItemText primary={value?.title} />
            </Box>
          </ListItem>
        ))}
      </List>
      <LogOut />
    </Paper>
  )
}

Menu.propTypes = {
  options: PropTypes.object,
  selectedOption: PropTypes.string,
  setSelectedOption: PropTypes.func,
  optionsRestrincted: PropTypes.array,
}

Menu.displayName = 'SettingsMenu'

export { Menu }
