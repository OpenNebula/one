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

import { Component, forwardRef } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { Plus } from 'iconoir-react'

import { STYLE_BUTTONS, T, TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'
import { Button } from '@modules/componentsv2/primitives/Buttons'
import { Text } from '@modules/componentsv2/primitives/Text'
import { getStyles } from '@modules/componentsv2/composed/EmptyContent/styles'

const Illustration = () => (
  <Box
    aria-hidden
    className="empty-content-illustration"
    component="svg"
    fill="none"
    viewBox="0 0 238 110"
  >
    <g opacity="0.36">
      <rect
        className="empty-content-card-muted"
        height="34"
        rx="4"
        width="150"
        x="44"
        y="0"
      />
      <path className="empty-content-line" d="M82 17h60" opacity="0.6" />
    </g>
    <g filter="url(#empty-content-shadow)">
      <rect
        className="empty-content-card-active"
        height="34"
        rx="4"
        width="150"
        x="44"
        y="38"
      />
      <rect
        className="empty-content-icon-active"
        height="4"
        rx="1"
        width="4"
        x="64"
        y="51"
      />
      <rect
        className="empty-content-icon-active"
        height="4"
        rx="1"
        width="4"
        x="70"
        y="51"
      />
      <rect
        className="empty-content-icon-active"
        height="4"
        rx="1"
        width="4"
        x="64"
        y="57"
      />
      <rect
        className="empty-content-icon-active"
        height="4"
        rx="1"
        width="4"
        x="70"
        y="57"
      />
      <path className="empty-content-line" d="M86 55h60" />
      <path
        className="empty-content-pointer empty-content-pointer-active"
        d="m169 53 5 3-5 3v-6Z"
      />
    </g>
    <g opacity="0.62">
      <rect
        className="empty-content-card"
        height="34"
        rx="4"
        width="150"
        x="44"
        y="80"
      />
      <rect
        className="empty-content-icon-muted"
        height="4"
        rx="1"
        width="4"
        x="64"
        y="93"
      />
      <rect
        className="empty-content-icon-muted"
        height="4"
        rx="1"
        width="4"
        x="70"
        y="93"
      />
      <rect
        className="empty-content-icon-muted"
        height="4"
        rx="1"
        width="4"
        x="64"
        y="99"
      />
      <rect
        className="empty-content-icon-muted"
        height="4"
        rx="1"
        width="4"
        x="70"
        y="99"
      />
      <path className="empty-content-line" d="M86 97h60" opacity="0.8" />
      <path
        className="empty-content-pointer empty-content-pointer-muted"
        d="m169 95 5 3-5 3v-6Z"
      />
    </g>
    <defs>
      <filter
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
        height="58"
        id="empty-content-shadow"
        width="174"
        x="32"
        y="28"
      >
        <feDropShadow
          dx="0"
          dy="4"
          floodColor="#000000"
          floodOpacity="0.08"
          stdDeviation="5"
        />
      </filter>
    </defs>
  </Box>
)

/**
 * Empty content state.
 *
 * @param {object} root0 - Props
 * @param {Function} root0.action - Optional action callback
 * @param {object} root0.actionProps - Optional action button props
 * @param {*} root0.actionTitle - Optional action button title
 * @param {*} root0.subtitle - Empty state subtitle
 * @param {*} root0.title - Empty state title
 * @param {'small'|'medium'} root0.size - Empty state size
 * @param {'default'|'error'} root0.status - Empty state status
 * @param {object|Array|Function} root0.sx - Custom SX styles
 * @returns {Component} - EmptyContent component
 */
export const EmptyContent = forwardRef(
  (
    {
      action,
      actionProps,
      actionTitle = T.Action,
      subtitle = T.ThereIsNoContent,
      title = T.NoContent,
      size = 'medium',
      status = 'default',
      sx,
    },
    ref
  ) => (
    <Box
      ref={ref}
      sx={[
        (theme) => getStyles({ theme, size, status }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ].filter(Boolean)}
    >
      <Illustration />
      <Box className="empty-content-body">
        <Box className="empty-content-text">
          <Text
            className="empty-content-title"
            value={title}
            variant={TEXT_VARIANTS.BODY_LARGE}
            weight={TEXT_WEIGHTS.SEMIBOLD}
          />
          <Text
            className="empty-content-subtitle"
            value={subtitle}
            variant={TEXT_VARIANTS.BODY_SMALL}
            weight={TEXT_WEIGHTS.REGULAR}
          />
        </Box>
        {action && (
          <Button
            startIcon={Plus}
            type={STYLE_BUTTONS.TYPE.PRIMARY}
            {...actionProps}
            onClick={action}
          >
            {actionTitle}
          </Button>
        )}
      </Box>
    </Box>
  )
)

EmptyContent.propTypes = {
  action: PropTypes.func,
  actionProps: PropTypes.object,
  actionTitle: PropTypes.node,
  size: PropTypes.oneOf(['small', 'medium']),
  status: PropTypes.oneOf(['default', 'error']),
  subtitle: PropTypes.node,
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.func]),
  title: PropTypes.node,
}

EmptyContent.displayName = 'EmptyContent'
