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
import { getStyles } from '@modules/componentsv2/primitives/Header/Default/styles'
import { Breadcrumbs } from '@modules/componentsv2/primitives/Header/Default/breadcrumbs'
import {
  CreateButtonSlot,
  ZoneDropdownSlot,
  UserGroupDropdownSlot,
} from '@modules/componentsv2/primitives/Header/Default/slots'

export const Header = forwardRef(
  (
    {
      slots = [[UserGroupDropdownSlot], [ZoneDropdownSlot], [CreateButtonSlot]],
    },
    ref
  ) => (
    <Box
      sx={(theme) =>
        getStyles({
          theme,
        })
      }
      ref={ref}
    >
      <Breadcrumbs className="header-breadcrumbs" />

      <Box className="header-slots">
        {slots?.map(([Slot, slotProps = {}, containerSx = {}], idx) => (
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
  )
)

Header.propTypes = {
  slots: PropTypes.array,
}

Header.displayName = 'Header'
