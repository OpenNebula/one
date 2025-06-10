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
import {
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import { forwardRef, memo, useMemo } from 'react'

import PropTypes from 'prop-types'

import clsx from 'clsx'

import { T } from '@ConstantsModule'
import { SubmitButtonStyles } from '@modules/components/FormControl/styles/SubmitButtonStyles'
import { ConditionalWrap, Tr } from '@modules/components/HOC'

const ButtonComponent = forwardRef(
  (
    {
      icon,
      endicon,
      children,
      size,
      value,
      label,
      classes,
      noborder,
      active,
      ...props
    },
    ref
  ) =>
    icon && !endicon && !label ? (
      <IconButton
        ref={ref}
        {...props}
        color="primary"
        className={clsx(classes.button, classes.icon)}
        value={value}
      >
        {children}
      </IconButton>
    ) : (
      <Button
        ref={ref}
        type="submit"
        endIcon={endicon}
        startIcon={label && icon}
        className={clsx(classes.button, classes.iconWithOptions)}
        {...props}
      >
        {children}
      </Button>
    )
)

const TooltipComponent = ({ tooltip, tooltipLink, tooltipprops, children }) => {
  const theme = useTheme()
  const classes = useMemo(() => SubmitButtonStyles(theme), [theme])

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
                {Tr(tooltip)}{' '}
                <a
                  className={classes.tooltipLink}
                  target="_blank"
                  href={tooltipLink.link}
                  rel="noreferrer"
                >
                  {Tr(tooltipLink.text)}
                </a>
              </Typography>
            ) : (
              <Typography variant="subtitle2">{Tr(tooltip)}</Typography>
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

const SubmitButton = memo(
  ({ isSubmitting, disabled, label, icon, loadOnIcon = false, ...props }) => {
    const theme = useTheme()

    const classes = useMemo(
      () =>
        SubmitButtonStyles({
          theme,
          importance: props?.importance,
          icon,
          endIcon: props?.endicon,
          label,
          type: props?.type,
          size: props?.size,
          sx: props?.sx,
          noborder: props?.noborder,
          active: props?.active,
        }),
      [theme, props, icon, label]
    )

    const progressSize = icon?.props?.size ?? 20

    const labelAndIcon = label && icon

    return (
      <TooltipComponent {...props}>
        <ButtonComponent
          classes={classes}
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
            (icon ? (labelAndIcon ? Tr(label) : icon) : Tr(label))}
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
  classes: PropTypes.object,
  type: PropTypes.string,
  noborder: PropTypes.bool,
  active: PropTypes.bool,
}

TooltipComponent.propTypes = SubmitButtonPropTypes
SubmitButton.propTypes = SubmitButtonPropTypes
ButtonComponent.propTypes = SubmitButtonPropTypes

ButtonComponent.displayName = 'SubmitButtonComponent'
SubmitButton.displayName = 'SubmitButton'

export default SubmitButton
