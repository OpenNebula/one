/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { forwardRef, memo } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

import {
  makeStyles,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
  Typography
} from '@material-ui/core'

import { Tr, ConditionalWrap } from 'client/components/HOC'
import { T } from 'client/constants'

const useStyles = makeStyles(theme => ({
  root: {
    transition: 'disabled 0.5s ease',
    boxShadow: 'none'
  },
  disabled: {
    '& svg': {
      color: theme.palette.action.disabled
    }
  }
}))

const ButtonComponent = forwardRef(
  ({ icon, endicon, children, size = 'small', ...props }, ref) =>
    icon ? (
      <IconButton ref={ref} {...props}>{children}</IconButton>
    ) : (
      <Button ref={ref}
        type='submit'
        endIcon={endicon}
        variant='contained'
        size={size}
        {...props}
      >
        {children}
      </Button>
    )
)

const TooltipComponent = ({ tooltip, tooltipProps, children }) => (
  <ConditionalWrap
    condition={tooltip && tooltip !== ''}
    wrap={wrapperChildren => (
      <Tooltip
        arrow
        placement='bottom'
        title={<Typography variant='subtitle2'>{tooltip}</Typography>}
        {...tooltipProps}
      >{wrapperChildren}</Tooltip>
    )}
  >
    {children}
  </ConditionalWrap>
)

const SubmitButton = memo(
  ({ isSubmitting, disabled, label, icon, className, ...props }) => {
    const classes = useStyles()

    return (
      <TooltipComponent {...props}>
        <ButtonComponent
          className={clsx(
            classes.root,
            className,
            { [classes.disabled]: disabled }
          )}
          disabled={disabled || isSubmitting}
          icon={icon}
          aria-label={label ?? T.Submit}
          {...props}
        >
          {isSubmitting && <CircularProgress color='secondary' size={24} />}
          {!isSubmitting && (icon ?? label ?? Tr(T.Submit))}
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
  tooltipProps: PropTypes.object,
  isSubmitting: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  color: PropTypes.oneOf(['default', 'inherit', 'primary', 'secondary']),
  size: PropTypes.oneOf(['large', 'medium', 'small'])
}

TooltipComponent.propTypes = SubmitButtonPropTypes
SubmitButton.propTypes = SubmitButtonPropTypes
ButtonComponent.propTypes = SubmitButtonPropTypes

ButtonComponent.displayName = 'SubmitButtonComponent'
SubmitButton.displayName = 'SubmitButton'

export default SubmitButton
