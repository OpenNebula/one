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
import { Box } from '@mui/material'
import { getStyles } from '@modules/componentsv2/composed/SearchBar/Default/slots/filter/styles'
import { ButtonGroup } from '@modules/componentsv2/primitives/Buttons/Group'
import { ViewGrid as GridIcon, List as ListIcon } from 'iconoir-react'
import PropTypes from 'prop-types'

/**
 * ViewSlot component.
 *
 * @param {object} root0 - Params
 * @returns {Component} - ViewSlot component
 */
export const ViewSlot = forwardRef(
  (
    { defaultView = 'card', onCardClick = () => {}, onListClick = () => {} },
    ref
  ) => {
    const isCardViewDefault = defaultView === 'card'

    return (
      <Box
        sx={(theme) =>
          getStyles({
            theme,
          })
        }
        ref={ref}
      >
        <ButtonGroup
          buttons={[
            {
              selected: isCardViewDefault,
              startIcon: <GridIcon height={16} width={16} />,
              onClick: () => onCardClick(),
            },
            {
              selected: !isCardViewDefault,
              startIcon: <ListIcon height={16} width={16} />,
              onClick: () => onListClick(),
            },
          ]}
        />
      </Box>
    )
  }
)

ViewSlot.displayName = 'ViewSlot'
ViewSlot.propTypes = {
  defaultView: PropTypes.string,
  onCardClick: PropTypes.func,
  onListClick: PropTypes.func,
}
