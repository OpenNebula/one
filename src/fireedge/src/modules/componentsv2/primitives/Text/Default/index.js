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
import { Typography as MUITypography } from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/Text/Default/styles'
import { TEXT_COMPONENTS, TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'

/**
 * @param {object} root0 - Params
 * @param {string} root0.variant - Text variant
 * @param {string} root0.weight - Text weight
 * @param {string|Component} root0.component - Text HTML element or component
 * @param {*} root0.value - Text content
 * @param {any|any[]} root0.values - Translation interpolation values
 * @returns {Component} - Custom MUI Text component
 */
export const Text = forwardRef(
  (
    {
      variant = TEXT_VARIANTS.BODY_MEDIUM,
      weight = TEXT_WEIGHTS.REGULAR,
      value,
      values = [],
      component,
      ...opts
    },
    ref
  ) => {
    const { translateText } = useTranslation()
    const { sx, ...typographyProps } = opts
    const textComponent = component ?? TEXT_COMPONENTS[variant]

    return (
      <MUITypography
        ref={ref}
        component={textComponent}
        {...typographyProps}
        sx={[
          (theme) => getStyles({ theme, variant, weight, ...typographyProps }),
          ...(Array.isArray(sx) ? sx : [sx]),
        ].filter(Boolean)}
      >
        {typeof value === 'string' ? translateText(value, values) : value}
      </MUITypography>
    )
  }
)

Text.propTypes = {
  component: PropTypes.elementType,
  value: PropTypes.node,
  values: PropTypes.any,
  variant: PropTypes.oneOf(Object.values(TEXT_VARIANTS)),
  weight: PropTypes.oneOf(Object.values(TEXT_WEIGHTS)),
}

Text.displayName = 'Text'
