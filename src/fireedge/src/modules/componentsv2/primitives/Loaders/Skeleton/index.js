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
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Component, Fragment, forwardRef } from 'react'

import { getStyles } from '@modules/componentsv2/primitives/Loaders/Skeleton/styles'

const SKELETON_VARIANTS = ['text', 'rounded', 'rectangular', 'circular']
const SKELETON_ANIMATIONS = ['pulse', 'wave']

/**
 * Replaces its children with a size-preserving loading placeholder.
 *
 * Numeric dimensions are interpreted as pixels. Responsive objects and CSS
 * dimensions are also supported to match the geometry of the final content.
 *
 * @param {object} props - Component properties
 * @param {boolean} props.loading - Whether the placeholder is visible
 * @param {number|string|object} props.width - Placeholder width
 * @param {number|string|object} props.height - Placeholder height
 * @param {'text'|'rounded'|'rectangular'|'circular'} props.variant - Shape
 * @param {number|string} props.borderRadius - Theme radius key or CSS radius
 * @param {'pulse'|'wave'|false} props.animation - Loading animation
 * @param {string} props.ariaLabel - Accessible loading description
 * @param {string} props.className - Placeholder class name
 * @param {Component} props.children - Loaded content
 * @param {object} ref - Forwarded placeholder ref
 * @returns {Component} Loaded content or placeholder
 */
export const SkeletonLoading = forwardRef(
  (
    {
      loading = false,
      width,
      height,
      variant = 'rounded',
      borderRadius,
      animation = 'wave',
      ariaLabel,
      className = '',
      children,
      ...opts
    },
    ref
  ) => {
    if (!loading) {
      return children !== undefined && children !== null ? (
        <Fragment>{children}</Fragment>
      ) : null
    }

    return (
      <Box
        ref={ref}
        className={`skeleton-loading skeleton-loading-${variant} ${className}`}
        role={ariaLabel ? 'status' : undefined}
        aria-label={ariaLabel}
        aria-hidden={ariaLabel ? undefined : true}
        {...opts}
        sx={(theme) =>
          getStyles({
            theme,
            width,
            height,
            variant,
            borderRadius,
            animation,
          })
        }
      />
    )
  }
)

SkeletonLoading.propTypes = {
  loading: PropTypes.bool,
  width: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
    PropTypes.object,
  ]),
  height: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
    PropTypes.object,
  ]),
  variant: PropTypes.oneOf(SKELETON_VARIANTS),
  borderRadius: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  animation: PropTypes.oneOfType([
    PropTypes.oneOf(SKELETON_ANIMATIONS),
    PropTypes.oneOf([false]),
  ]),
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
}

SkeletonLoading.displayName = 'SkeletonLoading'
