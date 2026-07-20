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
import { Box } from '@mui/material'
import { MoreVert } from 'iconoir-react'

import { T } from '@ConstantsModule'
import { Card } from '@modules/componentsv2/composed/Cards/Default'
import { MenuButton } from '@modules/componentsv2/primitives/Buttons'
import {
  getStyles,
  getWrapperStyles,
} from '@modules/componentsv2/composed/Cards/CardBlock/styles'

const hasActions = (actions) =>
  Array.isArray(actions) ? actions.flat().filter(Boolean).length > 0 : !!actions

const getActionOptions = (actions) =>
  Array.isArray(actions?.[0]) ? actions : [actions]

const renderActions = (actions) => {
  if (!hasActions(actions)) return null

  return Array.isArray(actions) ? (
    <MenuButton
      iconOnly={<MoreVert />}
      options={getActionOptions(actions)}
      placeholder={T.Options}
    />
  ) : (
    actions
  )
}

/**
 * CardBlock component.
 *
 * @param {object} root0 - Params
 * @param {Array|Element} root0.actions - Menu actions or a custom actions node
 * @param {boolean} root0.isRemoveCheckbox - Remove checkbox from card
 * @param {boolean} root0.isSelectable - Card can be selected
 * @param {boolean} root0.isSelected - Card is selected
 * @param {object|Array|Function} root0.sx - Custom SX styles
 * @returns {Component} - CardBlock component
 */
export const CardBlock = forwardRef(
  (
    {
      actions,
      dataCy,
      isRemoveCheckbox = false,
      isSelectable = true,
      isSelected = false,
      onClick,
      sx,
      ...props
    },
    ref
  ) => {
    const showActions = hasActions(actions)

    return (
      <Box ref={ref} sx={(theme) => getWrapperStyles({ theme })}>
        <Card
          isRemoveCheckbox={!isSelectable || isRemoveCheckbox}
          isSelected={isSelected}
          onClick={isSelectable ? onClick : undefined}
          dataCy={dataCy}
          sx={[
            (theme) =>
              getStyles({
                theme,
                hasActions: showActions,
                isSelected,
                isSelectable,
              }),
            ...(Array.isArray(sx) ? sx : [sx]),
          ].filter(Boolean)}
          {...props}
        />
        {showActions && (
          <Box
            className="card-block-actions"
            data-cy={dataCy ? `${dataCy}-actions` : undefined}
            onClick={(event) => event.stopPropagation()}
          >
            {renderActions(actions)}
          </Box>
        )}
      </Box>
    )
  }
)

CardBlock.propTypes = {
  actions: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.element,
    PropTypes.node,
  ]),
  icon: PropTypes.node,
  isRemoveCheckbox: PropTypes.bool,
  isSelectable: PropTypes.bool,
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
  slots: PropTypes.array,
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.func]),
}

CardBlock.displayName = 'CardBlock'
