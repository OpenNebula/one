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
import {
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material'
import { forwardRef, memo, cloneElement } from 'react'
import PropTypes from 'prop-types'
import { T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'

const ButtonComponent = forwardRef(
  (
    { icon, endicon, children, size, value, label, noborder, active, ...props },
    ref
  ) =>
    icon && !endicon && !label ? (
      <IconButton ref={ref} {...props} color="primary" value={value}>
        {children}
      </IconButton>
    ) : (
      <Button
        ref={ref}
        type="submit"
        endIcon={endicon}
        startIcon={label && icon}
        {...props}
      >
        {children}
      </Button>
    )
)

const ConditionalWrap = ({ condition, children, wrap }) =>
  condition ? cloneElement(wrap(children)) : children

const TooltipComponent = ({ tooltip, tooltipLink, tooltipprops, children }) => {
  const { translate } = useTranslation()

  return (
    <ConditionalWrap
      condition={tooltip && tooltip !== ''}
      wrap={(wrapperChildren) => (
        <Tooltip
          arrow
          placement="bottom"
          title={
            tooltipLink ? (
              <Typography variant="subtitle2">
                {translate(tooltip)}{' '}
                <a target="_blank" href={tooltipLink.link} rel="noreferrer">
                  {translate(tooltipLink.text)}
                </a>
              </Typography>
            ) : (
              <Typography variant="subtitle2">{translate(tooltip)}</Typography>
            )
          }
          {...tooltipprops}
        >
          <span>{wrapperChildren}</span>
        </Tooltip>
      )}
    >
      {children}
    </ConditionalWrap>
  )
}

export const SubmitButton = memo(
  ({ isSubmitting, disabled, label, icon, loadOnIcon = false, ...props }) => {
    const { translate } = useTranslation()
    const progressSize = icon?.props?.size ?? 20

    const labelAndIcon = label && icon

    return (
      <TooltipComponent {...props}>
        <ButtonComponent
          disabled={disabled || isSubmitting}
          icon={
            loadOnIcon && isSubmitting ? (
              <CircularProgress size={progressSize} />
            ) : (
              icon
            )
          }
          aria-label={label ?? T.Submit}
          label={label}
          {...props}
        >
          {!loadOnIcon && isSubmitting && (
            <CircularProgress size={progressSize} />
          )}
          {(!isSubmitting || loadOnIcon) &&
            (icon
              ? labelAndIcon
                ? translate(label)
                : icon
              : translate(label))}
        </ButtonComponent>
      </TooltipComponent>
    )
  },
  (prev, next) =>
    prev.icon === next.icon &&
    prev.isSubmitting === next.isSubmitting &&
    prev.disabled === next.disabled &&
    prev.label === next.label &&
    prev.onClick === next.onClick
)

export const SubmitButtonPropTypes = {
  children: PropTypes.any,
  icon: PropTypes.node,
  endicon: PropTypes.node,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  tooltip: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  tooltipLink: PropTypes.object,
  tooltipprops: PropTypes.object,
  isSubmitting: PropTypes.bool,
  disabled: PropTypes.bool,
  loadOnIcon: PropTypes.bool,
  className: PropTypes.string,
  color: PropTypes.string,
  size: PropTypes.string,
  variant: PropTypes.string,
  value: PropTypes.string,
  sx: PropTypes.object,
  importance: PropTypes.string,
  type: PropTypes.string,
  noborder: PropTypes.bool,
  active: PropTypes.bool,
}

TooltipComponent.propTypes = SubmitButtonPropTypes
SubmitButton.propTypes = SubmitButtonPropTypes
ButtonComponent.propTypes = SubmitButtonPropTypes

ButtonComponent.displayName = 'SubmitButtonComponent'
SubmitButton.displayName = 'SubmitButton'
