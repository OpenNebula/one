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

import { useState, Component } from 'react'
import { Box, Button, Menu, MenuItem, IconButton } from '@mui/material'
import PropTypes from 'prop-types'
import { NavArrowDown } from 'iconoir-react'
import { Tr } from 'client/components/HOC'

/**
 * @param {object} root0 - Props
 * @param {object} root0.items - Button props
 * @param {object} root0.options - Button styles
 * @returns {Component} - Custom Button
 */
export const ButtonGenerator = ({ items, options = {} }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const handleClick = (event, onClick) => {
    if (Array.isArray(items)) {
      setAnchorEl(event.currentTarget)
    } else if (onClick) {
      onClick()
    }
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  if (Array.isArray(items)) {
    return (
      <Box>
        {options?.button?.type === 'icon' ? (
          <IconButton
            aria-controls="customized-menu"
            aria-haspopup="true"
            variant="contained"
            color="secondary"
            onClick={handleClick}
            {...options?.button}
            sx={{
              ...options?.button?.sx,
            }}
          >
            {options?.button?.icon ?? <NavArrowDown />}
          </IconButton>
        ) : (
          <Button
            aria-controls="customized-menu"
            aria-haspopup="true"
            variant="contained"
            color="secondary"
            onClick={handleClick}
            endIcon={items.length > 1 ? <NavArrowDown /> : null}
            {...options?.button}
          >
            {options?.button?.title ? Tr(options?.button?.title) : ''}
          </Button>
        )}
        <Menu
          id="customized-menu"
          anchorEl={anchorEl}
          keepMounted
          open={open}
          onClose={handleClose}
          {...options?.menu}
        >
          {items.map(({ name, onClick }, index) => (
            <MenuItem
              key={index}
              onClick={() => {
                onClick()
                handleClose()
              }}
              {...options?.menuItem}
            >
              {Tr(name)}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    )
  } else {
    return options?.singleButton?.type === 'icon' ? (
      <IconButton
        aria-controls="customized-menu"
        aria-haspopup="true"
        onClick={(event) => handleClick(event, items.onClick)}
        {...options?.button}
        sx={{
          ...options?.singleButton?.sx,
        }}
      >
        {options?.singleButton?.icon ?? <NavArrowDown />}
      </IconButton>
    ) : (
      <Button
        variant="contained"
        color="secondary"
        onClick={(event) => handleClick(event, items.onClick)}
        startIcon={items.icon || null}
        {...options?.singleButton}
        sx={{
          ...options?.singleButton?.sx,
        }}
      >
        {options?.singleButton?.title
          ? Tr(options?.singleButton?.title)
          : items.name
          ? Tr(items.name)
          : ''}
      </Button>
    )
  }
}

ButtonGenerator.propTypes = {
  items: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  options: PropTypes.object,
}
