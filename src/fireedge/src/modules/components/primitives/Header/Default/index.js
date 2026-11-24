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

import { forwardRef } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { getStyles } from '@modules/components/primitives/Header/Default/styles'
import { Breadcrumbs } from '@modules/components/primitives/Header/Default/breadcrumbs'
import { ProgressBar } from '@modules/components/primitives/Progress/Bar'
import {
  CancelButtonSlot,
  CreateButtonSlot,
  ZoneDropdownSlot,
  UserGroupDropdownSlot,
} from '@modules/components/primitives/Header/Default/slots'
import { useCreationForm } from '@ProvidersModule'

const DEFAULT_SLOTS = [
  [UserGroupDropdownSlot],
  [ZoneDropdownSlot],
  [CreateButtonSlot],
]
const CREATION_SLOTS = [[CancelButtonSlot]]

export const Header = forwardRef(({ slots, variant = 'default' }, ref) => {
  const { activeStep, totalSteps } = useCreationForm()
  const isCreation = variant === 'creation'
  const showProgress = isCreation && totalSteps > 1
  const headerSlots = slots ?? (isCreation ? CREATION_SLOTS : DEFAULT_SLOTS)
  const progress = totalSteps
    ? Math.min(100, ((activeStep + 1) / (totalSteps + 1)) * 100)
    : 0

  return (
    <Box
      sx={(theme) =>
        getStyles({
          theme,
          isCreation,
          showProgress,
        })
      }
      ref={ref}
    >
      <Box className="header-content">
        <Breadcrumbs className="header-breadcrumbs" showHome={!isCreation} />

        <Box className="header-slots">
          {headerSlots?.map(([Slot, slotProps = {}, containerSx = {}], idx) => (
            <Box
              key={idx}
              className={`header-slot header-slot--${idx}`}
              sx={containerSx}
            >
              <Slot {...slotProps} />
            </Box>
          ))}
        </Box>
      </Box>

      {showProgress && (
        <ProgressBar
          className="header-progress"
          data-cy="creation-form-progress"
          size="extraSmall"
          value={progress}
        />
      )}
    </Box>
  )
})

Header.propTypes = {
  slots: PropTypes.array,
  variant: PropTypes.oneOf(['default', 'creation']),
}

Header.displayName = 'Header'
