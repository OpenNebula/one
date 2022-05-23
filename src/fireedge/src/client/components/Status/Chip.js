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
import { memo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { styled, Typography, alpha } from '@mui/material'
import { Copy as CopyIcon, Check as CopiedIcon, Cancel } from 'iconoir-react'

import { useClipboard } from 'client/hooks'

const Chip = styled(Typography)(
  ({ theme: { palette, typography }, state = 'debug', white, icon }) => {
    const { dark = state } = palette[state] ?? {}

    const bgColor = alpha(dark, 0.2)
    const color = white ? palette.common.white : palette.text.primary

    return {
      color,
      backgroundColor: bgColor,
      padding: icon ? '0.1rem 0.5rem' : '0.25rem 0.5rem',
      borderRadius: 6,
      textTransform: 'uppercase',
      fontSize: typography.overline.fontSize,
      fontWeight: 500,
      lineHeight: 'normal',
      cursor: 'default',
      ...(icon && {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5em',
        '& > .icon': {
          cursor: 'pointer',
          color,
          '&:hover': {
            color: white ? palette.getContrastText(color) : dark,
          },
        },
      }),
    }
  }
)

const callAll =
  (...fns) =>
  (...args) =>
    fns.forEach((fn) => fn && fn?.(...args))

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
        onDelete(text)
        evt.stopPropagation()
      },
      [text, onDelete]
    )

    return (
      <Chip
        component="span"
        state={stateColor}
        white={forceWhiteColor ? 'true' : undefined}
        icon={clipboard || onDelete ? 'true' : undefined}
        onClick={callAll(onClick, clipboard && handleCopy)}
        data-cy={dataCy}
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
