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
import { useMemo, forwardRef, memo } from 'react'
import {
  useTheme,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material'
import { css } from '@emotion/css'
import PropTypes from 'prop-types'

import clsx from 'clsx'

import { Tr, ConditionalWrap } from '@modules/components/HOC'
import { T } from '@ConstantsModule'

const useStyles = (theme) => ({
  root: css({
    transition: 'disabled 0.5s ease',
    boxShadow: 'none',
  }),
  disabled: css({
    '& svg': {
      color: theme.palette.action.disabled,
    },
  }),
  tooltipLink: css({
    color: theme.palette.secondary.main,
    textDecoration: 'none',
    '&:hover': {
      color: theme.palette.secondary.dark,
    },
  }),
})

const ButtonComponent = forwardRef(
  (
    { icon, endicon, children, size, variant = 'contained', value, ...props },
    ref
  ) =>
    icon && !endicon ? (
      <IconButton ref={ref} {...props} value={value}>
        {children}
      </IconButton>
    ) : (
      <Button
        ref={ref}
        type="submit"
        endIcon={endicon}
        variant={variant}
        {...props}
      >
        {children}
      </Button>
    )
)

const TooltipComponent = ({ tooltip, tooltipLink, tooltipprops, children }) => {
  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])

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
  ({ isSubmitting, disabled, label, icon, className, ...props }) => {
    const theme = useTheme()
    const classes = useMemo(() => useStyles(theme), [theme])
    const progressSize = icon?.props?.size ?? 20

    return (
      <TooltipComponent {...props}>
        <ButtonComponent
          className={clsx(classes.root, className, {
            [classes.disabled]: disabled,
          })}
          disabled={disabled || isSubmitting}
          icon={icon}
          aria-label={label ?? T.Submit}
          {...props}
        >
          {isSubmitting && (
            <CircularProgress color="secondary" size={progressSize} />
          )}
          {!isSubmitting && (icon ?? Tr(label) ?? Tr(T.Submit))}
        </ButtonComponent>
      </TooltipComponent>
    )
  },
  (prev, next) =>
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
  className: PropTypes.string,
  color: PropTypes.string,
  size: PropTypes.string,
  variant: PropTypes.string,
  value: PropTypes.string,
}

TooltipComponent.propTypes = SubmitButtonPropTypes
SubmitButton.propTypes = SubmitButtonPropTypes
ButtonComponent.propTypes = SubmitButtonPropTypes

ButtonComponent.displayName = 'SubmitButtonComponent'
SubmitButton.displayName = 'SubmitButton'

export default SubmitButton
