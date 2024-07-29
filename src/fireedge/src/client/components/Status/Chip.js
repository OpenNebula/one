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
import { memo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { styled, Typography, alpha } from '@mui/material'
import { Copy as CopyIcon, Check as CopiedIcon, Cancel } from 'iconoir-react'

import { useClipboard } from 'client/hooks'
import { SCHEMES } from 'client/constants'

const callAll =
  (...fns) =>
  (...args) =>
    fns.forEach((fn) => fn && fn?.(...args))

const Chip = styled(Typography)(({ theme: { palette }, ownerState }) => {
  const { dark = ownerState.state } = palette[ownerState.state] ?? {}

  const isWhite = ownerState.forceWhiteColor
  const bgColor = alpha(dark, palette.mode === SCHEMES.DARK ? 0.5 : 0.2)
  const color = isWhite ? palette.common.white : palette.text.primary
  const iconColor = isWhite ? palette.getContrastText(color) : dark

  return {
    color,
    backgroundColor: bgColor,
    padding: ownerState.hasIcon ? '0.1rem 0.5rem' : '0.25rem 0.5rem',
    cursor: 'default',
    userSelect: 'none',
    ...(ownerState.hasIcon && {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5em',
      '& > .icon': {
        cursor: 'pointer',
        color,
        '&:hover': { color: iconColor },
      },
    }),
    ...(ownerState.clickable && {
      WebkitTapHighlightColor: 'transparent',
      cursor: 'pointer',
      '&:hover, &:focus': {
        backgroundColor: alpha(bgColor, 0.3),
      },
    }),
  }
})

const StatusChip = memo(
  ({
    stateColor,
    text = '',
    dataCy = '',
    clipboard,
    onClick,
    onDelete,
    forceWhiteColor,
    ...props
  }) => {
    const { copy, isCopied } = useClipboard()

    const ownerState = {
      forceWhiteColor,
      hasIcon: clipboard || onDelete ? 'true' : undefined,
      clickable: !!onClick,
      state: stateColor || 'debug',
    }

    const handleCopy = useCallback(
      (evt) => {
        const textToCopy = typeof clipboard === 'string' ? clipboard : text

        !isCopied && copy(textToCopy)
        evt.stopPropagation()
      },
      [clipboard, copy, text, isCopied]
    )

    const handleDelete = useCallback(
      (evt) => {
        onDelete?.(text)
        evt.stopPropagation()
      },
      [text, onDelete]
    )

    const handleClick = useCallback(
      (evt) => {
        onClick?.(text)
        evt.stopPropagation()
      },
      [text, onClick]
    )

    return (
      <Chip
        component="span"
        variant="overline"
        lineHeight="normal"
        borderRadius="0.5em"
        ownerState={ownerState}
        onClick={callAll(handleClick, clipboard && handleCopy)}
        data-cy={dataCy}
        sx={{ textTransform: 'none' }}
        {...props}
      >
        {text}
        {clipboard &&
          (isCopied ? <CopiedIcon /> : <CopyIcon className="icon" />)}
        {typeof onDelete === 'function' && (
          <Cancel onClick={handleDelete} className="icon" />
        )}
      </Chip>
    )
  },
  (prev, next) =>
    prev.stateColor === next.stateColor &&
    prev.text === next.text &&
    prev.clipboard === next.clipboard &&
    prev.onDelete === next.onDelete
)

StatusChip.propTypes = {
  stateColor: PropTypes.string,
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  clipboard: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  forceWhiteColor: PropTypes.bool,
  dataCy: PropTypes.string,
  onClick: PropTypes.func,
  onDelete: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
}

StatusChip.displayName = 'StatusChip'

export default StatusChip
