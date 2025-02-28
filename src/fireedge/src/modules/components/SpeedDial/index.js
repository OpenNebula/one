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
import { useMemo, useState, JSXElementConstructor } from 'react'
import {
  useTheme,
  SpeedDial as MSpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
} from '@mui/material'
import { css } from '@emotion/css'

import PropTypes from 'prop-types'

const useStyles = (theme) => ({
  root: css({
    position: 'absolute',
    '&.MuiSpeedDial-directionUp, &.MuiSpeedDial-directionLeft': {
      bottom: theme.spacing(2),
      right: theme.spacing(2),
    },
    '&.MuiSpeedDial-directionDown, &.MuiSpeedDial-directionRight': {
      top: theme.spacing(2),
      left: theme.spacing(2),
    },
  }),
})

/**
 * Floating action button can display 3 to 6 actions
 * in the form of a speed dial.
 *
 * @param {object} props - Props
 * @param {boolean} props.hidden - If `true`, the SpeedDial will be hidden
 * @param {{
 * name: string,
 * icon: object,
 * handleClick: Function}[]} props.actions - List of actions
 * @returns {JSXElementConstructor} SpeedDial component
 */
const SpeedDial = ({ hidden = false, actions = [] }) => {
  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])
  const [open, setOpen] = useState(false)

  const handleClose = () => {
    setOpen(false)
  }

  const handleOpen = () => {
    setOpen(true)
  }

  return (
    <MSpeedDial
      ariaLabel="SpeedDial"
      className={classes.root}
      hidden={hidden}
      icon={<SpeedDialIcon />}
      onClose={handleClose}
      onOpen={handleOpen}
      open={open}
      direction="up"
    >
      {actions?.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          onClick={action.handleClick}
        />
      ))}
    </MSpeedDial>
  )
}

SpeedDial.propTypes = {
  hidden: PropTypes.bool,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      icon: PropTypes.node.isRequired,
      handleClick: PropTypes.func,
    })
  ),
}

SpeedDial.defaultProps = {
  hidden: false,
  actions: [],
}

export default SpeedDial
