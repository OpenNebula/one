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
import PropTypes from 'prop-types'
import { memo } from 'react'

import { Box } from '@mui/material'
import { useController } from 'react-hook-form'

import { AlertNotification, Datepicker } from '@modules/componentsv2/primitives'
import { generateKey } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'

const toDate = (value) => {
  if (value?.isValid && typeof value.toJSDate === 'function') {
    return value.toJSDate()
  }

  return value ?? null
}

const fixedPopperProps = { strategy: 'fixed' }
const datepickerPortalId = 'componentsv2-datepicker-portal'

export const TimeController = memo(
  ({
    control,
    cy = `input-date-${generateKey()}`,
    name = '',
    label = '',
    fieldProps: { defaultValue, minDateTime, ...fieldProps } = {},
    readOnly = false,
  }) => {
    const { translate } = useTranslation()
    const {
      field: { value, onChange, onBlur },
      fieldState: { error },
    } = useController({ name, control, defaultValue })

    return (
      <Box sx={{ display: 'grid', gap: 0.5, width: '100%' }}>
        <Datepicker
          {...fieldProps}
          value={toDate(value)}
          label={translate(label)}
          placeholder="DD/MM/YYYY HH:mm"
          dateFormat="Pp"
          showTimeSelect
          popperPlacement="bottom-start"
          popperProps={fixedPopperProps}
          portalId={datepickerPortalId}
          minDate={toDate(minDateTime)}
          disabled={readOnly}
          dataCy={cy}
          onChange={(date) => {
            onBlur()
            onChange(date ?? undefined)
          }}
        />
        {Boolean(error?.message) && (
          <AlertNotification
            data-cy={`${cy}-error`}
            description={error.message}
            type="inline"
            status="error"
          />
        )}
      </Box>
    )
  },
  (prevProps, nextProps) =>
    prevProps.label === nextProps.label &&
    prevProps.tooltip === nextProps.tooltip
)

TimeController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  tooltip: PropTypes.any,
  fieldProps: PropTypes.object,
  readOnly: PropTypes.bool,
}

TimeController.displayName = 'TimeController'
