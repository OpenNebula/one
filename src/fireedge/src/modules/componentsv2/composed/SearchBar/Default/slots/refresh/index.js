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

import { forwardRef, Component } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { getStyles } from '@modules/componentsv2/composed/SearchBar/Default/slots/search/styles'
import { Button } from '@modules/componentsv2/primitives/Buttons/Default'
import { RefreshDouble as RefreshIcon } from 'iconoir-react'
import { STYLE_BUTTONS } from '@ConstantsModule'

/**
 * RefreshSlot component.
 *
 * @param {object} root0 - Params
 * @param {string} root0.onRefresh - On refresh handler
 * @param {boolean} root0.isRefreshing - Disabled
 * @returns {Component} - TextField component
 */
export const RefreshSlot = forwardRef(
  ({ onRefresh = () => {}, isRefreshing = false, dataCy }, ref) => (
    <Box
      sx={(theme) =>
        getStyles({
          theme,
        })
      }
      ref={ref}
    >
      <Button
        onClick={onRefresh}
        data-cy={dataCy}
        isDisabled={isRefreshing}
        iconOnly={<RefreshIcon height={'16px'} width={'16px'} />}
        size={'medium'}
        type={STYLE_BUTTONS.TYPE.OUTLINE}
        sx={{
          height: '40px', // Overriding defaults
          width: '40px',
          padding: '8px',
        }}
      />
    </Box>
  )
)

RefreshSlot.propTypes = {
  onRefresh: PropTypes.func,
  isRefreshing: PropTypes.bool,
  dataCy: PropTypes.string,
}

RefreshSlot.displayName = 'RefreshSlot'
