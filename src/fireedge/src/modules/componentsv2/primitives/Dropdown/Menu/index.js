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

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  Avatar,
  Box,
  ClickAwayListener,
  Paper,
  Popper,
  Typography,
  useTheme,
} from '@mui/material'

import { getStyles } from '@modules/componentsv2/primitives/Dropdown/Menu/styles'

/**
 * Dropdown menu component.
 *
 * @param {object} props - Component properties.
 * @param {boolean} props.expanded - Whether the dropdown is expanded.
 * @param {string} props.title - Dropdown title.
 * @param {string} [props.subtitle] - Dropdown subtitle.
 * @param {string} [props.image] - Avatar image URL.
 * @param {string} [props.initials] - Avatar initials.
 * @param {string} [props.placement] - Popper placement.
 * @param {number[]} [props.offset] - Popper offset.
 * @param {string} [props.id] - Popper id.
 * @param {Function} [props.onClose] - Close callback.
 * @param {Function} [props.onOpen] - Open callback.
 * @param {string} [props.avatarSize] - Avatar size.
 * @param {React.ElementType} [props.icon] - Icon component to display when expanded.
 * @param {React.ElementType} [props.openIcon] - Icon component to display when opened.
 * @param {React.ReactNode} [props.children] - Dropdown content.
 * @param {string} [props.className] - Component class name
 * @param {string} [props.dataCy] - Cypress selector prefix
 * @returns {React.Element} The rendered dropdown menu component.
 */
export const MenuDropdown = ({
  expanded,
  title,
  id,
  subtitle,
  icon: Icon,
  openIcon: OpenIcon,
  image,
  className,
  initials,
  avatarSize,
  placement = 'top-start',
  offset = [0, 0],
  onClose = () => {},
  onOpen = () => {},
  children,
  dataCy,
}) => {
  const muiTheme = useTheme()
  const [open, setOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const CurrentIcon = open && OpenIcon ? OpenIcon : Icon

  const handleClose = () => {
    onClose()
    setOpen(false)
  }

  const handleToggle = (event) => {
    setAnchorEl(event.currentTarget)
    setOpen((previousOpen) => {
      previousOpen ? onClose() : onOpen()

      return !previousOpen
    })
  }

  return (
    <>
      <Box
        sx={(theme) =>
          getStyles({
            theme,
            avatarSize,
          })
        }
        component="button"
        type="button"
        className={[
          'menu-dropdown',
          className,
          !image && 'without-image',
          expanded && 'expanded',
          open && 'open',
        ]
          .filter(Boolean)
          .join(' ')}
        data-cy={dataCy}
        onClick={handleToggle}
      >
        <Avatar src={image} className="avatar">
          {initials}
        </Avatar>
        {expanded && (
          <>
            <Box className="info">
              <Typography className="title">{title}</Typography>
              {subtitle && (
                <Typography className="subtitle">{subtitle}</Typography>
              )}
            </Box>
            {CurrentIcon && <CurrentIcon className="icon" />}
          </>
        )}
      </Box>

      <Popper
        id={id}
        open={open}
        anchorEl={anchorEl}
        placement={placement}
        disablePortal
        style={{ zIndex: muiTheme.zIndex.drawer + 1 }}
        modifiers={[
          {
            name: 'offset',
            options: {
              offset,
            },
          },
        ]}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper
            className="popup"
            data-cy={dataCy && `${dataCy}-list`}
            sx={(theme) => {
              const styles = getStyles({
                theme,
                avatarSize,
              })
              const anchorWidth = anchorEl?.getBoundingClientRect().width
              const popupMinWidth = styles['&.popup'].minWidth

              return {
                ...styles,
                '&.popup': {
                  ...styles['&.popup'],
                  minWidth: anchorWidth
                    ? `max(${popupMinWidth}, ${-offset[0] * 2 + anchorWidth}px)`
                    : popupMinWidth,
                },
              }
            }}
          >
            {children}
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  )
}

MenuDropdown.propTypes = {
  expanded: PropTypes.bool,
  title: PropTypes.string,
  id: PropTypes.string,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  openIcon: PropTypes.elementType,
  image: PropTypes.string,
  initials: PropTypes.string,
  avatarSize: PropTypes.oneOf(['small', 'medium']),
  placement: PropTypes.string,
  offset: PropTypes.arrayOf(PropTypes.number),
  onClose: PropTypes.func,
  onOpen: PropTypes.func,
  className: PropTypes.string,
  dataCy: PropTypes.string,
  children: PropTypes.node,
}

MenuDropdown.displayName = 'MenuDropdown'
