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
import { memo, useState, useMemo } from 'react'
import { useTheme } from '@mui/material'
import { css } from '@emotion/css'
import PropTypes from 'prop-types'

import clsx from 'clsx'
import {
  NavArrowRight as CollapseIcon,
  NavArrowDown as ExpandMoreIcon,
} from 'iconoir-react'

import { DEBUG_LEVEL } from '@ConstantsModule'
import AnsiHtml from '@modules/components/DebugLog/ansiHtml'

const MAX_CHARS = 80

const useStyles = (theme) => ({
  root: css({
    marginBottom: '0.3em',
    padding: '0.5em 0',
    fontSize: '14px',
    fontFamily: 'monospace',
    color: '#fafafa',
    '&:hover': {
      background: '#333537',
    },
    display: 'grid',
    gridTemplateColumns: '32px 220px 1fr',
    gap: '1em',
    alignItems: 'center',
    cursor: ({ isMoreThanMaxChars }) =>
      isMoreThanMaxChars ? 'pointer' : 'default',
  }),
  message: css({
    transition: 'all 0.3s ease-out',
    whiteSpace: 'pre-line',
  }),
  [DEBUG_LEVEL.ERROR]: css({
    borderLeft: `0.3em solid ${theme.palette.error.light}`,
  }),
  [DEBUG_LEVEL.WARN]: css({
    borderLeft: `0.3em solid ${theme.palette.warning.light}`,
  }),
  [DEBUG_LEVEL.INFO]: css({
    borderLeft: `0.3em solid ${theme.palette.info.light}`,
  }),
  [DEBUG_LEVEL.DEBUG]: css({
    borderLeft: `0.3em solid ${theme.palette.debug.main}`,
  }),
})

const Message = memo(({ timestamp, severity, message }) => {
  const isMoreThanMaxChars = message?.length >= MAX_CHARS
  const [isCollapsed, setCollapse] = useState(() => isMoreThanMaxChars)
  const theme = useTheme()
  const classes = useMemo(
    () => useStyles({ ...theme, isMoreThanMaxChars }),
    [theme]
  )

  const textToShow =
    isCollapsed && isMoreThanMaxChars
      ? `${message?.slice(0, MAX_CHARS)}…`
      : message

  const html = AnsiHtml(textToShow)

  return (
    <div
      className={clsx(classes.root, classes[severity])}
      onClick={() => setCollapse((prev) => !prev)}
      data-cy="message"
    >
      <span>
        {isMoreThanMaxChars &&
          (isCollapsed ? <CollapseIcon /> : <ExpandMoreIcon />)}
      </span>
      <div>{timestamp}</div>
      <div
        className={classes.message}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
})

Message.propTypes = {
  timestamp: PropTypes.string,
  severity: PropTypes.oneOf(Object.keys(DEBUG_LEVEL)),
  message: PropTypes.string,
}

Message.defaultProps = {
  timestamp: '',
  severity: DEBUG_LEVEL.DEBUG,
  message: '',
}

Message.displayName = 'Message'

export default Message
