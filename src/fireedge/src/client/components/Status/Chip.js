/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { memo } from 'react'
import PropTypes from 'prop-types'

import { Typography, Tooltip, lighten, darken } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { Copy as CopyIcon } from 'iconoir-react'

import { useClipboard } from 'client/hooks'
import { Tr, Translate } from 'client/components/HOC'
import { addOpacityToColor } from 'client/utils'
import { T, SCHEMES } from 'client/constants'

const useStyles = makeStyles(({ spacing, palette, typography }) => {
  const getBackgroundColor = palette.mode === SCHEMES.DARK ? lighten : darken
  const defaultStateColor =
    palette.grey[palette.mode === SCHEMES.DARK ? 300 : 700]

  return {
    text: ({ stateColor = defaultStateColor, clipboard }) => {
      const paletteColor = palette[stateColor]

      const color =
        paletteColor?.contrastText ?? getBackgroundColor(stateColor, 0.75)
      const bgColor = paletteColor?.dark ?? stateColor

      return {
        color,
        backgroundColor: addOpacityToColor(bgColor, 0.2),
        padding: spacing('0.25rem', '0.5rem'),
        borderRadius: 2,
        textTransform: 'uppercase',
        fontSize: typography.overline.fontSize,
        fontWeight: 500,
        lineHeight: 'normal',
        cursor: 'default',
        ...(clipboard && {
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5em',
          '&:hover > .copy-icon': {
            color: bgColor,
          },
        }),
      }
    },
  }
})

const callAll =
  (...fns) =>
  (...args) =>
    fns.forEach((fn) => fn && fn?.(...args))

const StatusChip = memo(
  ({
    stateColor,
    text = '',
    dataCy = '',
    clipboard = false,
    onClick,
    ...props
  }) => {
    const { copy, isCopied } = useClipboard()
    const textToCopy = typeof clipboard === 'string' ? clipboard : text
    const classes = useStyles({ stateColor, clipboard })

    const handleCopy = (evt) => {
      !isCopied && copy(textToCopy)
      evt.stopPropagation()
    }

    return (
      <Tooltip
        arrow
        open={isCopied}
        title={
          <>
            {'✔️'}
            <Translate word={T.CopiedToClipboard} />
          </>
        }
      >
        <Typography
          component="span"
          className={classes.text}
          onClick={callAll(onClick, clipboard && handleCopy)}
          {...(dataCy && { 'data-cy': dataCy })}
          {...props}
        >
          {text}
          {clipboard && (
            <CopyIcon className="copy-icon" title={Tr(T.ClickToCopy)} />
          )}
        </Typography>
      </Tooltip>
    )
  },
  (prev, next) =>
    prev.stateColor === next.stateColor &&
    prev.text === next.text &&
    prev.clipboard === next.clipboard
)

StatusChip.propTypes = {
  stateColor: PropTypes.string,
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  clipboard: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  dataCy: PropTypes.string,
  onClick: PropTypes.func,
}

StatusChip.displayName = 'StatusChip'

export default StatusChip
