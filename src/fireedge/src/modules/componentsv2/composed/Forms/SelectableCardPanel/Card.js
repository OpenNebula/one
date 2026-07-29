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
import clsx from 'clsx'
import { Box } from '@mui/material'
import { Trash } from 'iconoir-react'
import { renderIcon } from '@UtilsModule'
import { getSelectableCardPanelCardStyles } from '@modules/componentsv2/composed/Forms/SelectableCardPanel/styles'

import { SubmitButton } from '@modules/componentsv2/primitives/Buttons/Submit'

/**
 * Resolves a plain value or renderer function.
 *
 * @param {Function|*} renderer - Value or renderer
 * @param {...*} args - Renderer arguments
 * @returns {*} Rendered value
 */
const renderValue = (renderer, ...args) =>
  typeof renderer === 'function' ? renderer(...args) : renderer

/**
 * Card used in the selectable panel sidebar.
 *
 * @param {object} props - Component props
 * @param {*} props.item - Rendered item
 * @param {number} props.index - Item index
 * @param {boolean} props.isSelected - Whether the card is selected
 * @param {Function} props.onClick - Select handler
 * @param {Function} props.onRemove - Remove handler
 * @param {boolean|Function} props.canRemove - Remove visibility
 * @param {*} props.icon - Card icon
 * @param {Function|*} props.renderTitle - Title renderer
 * @param {Function|*} props.renderSubtitle - Subtitle renderer
 * @param {string} props.className - Extra card class name
 * @param {string} props.titleClassName - Extra title class name
 * @param {string} props.subtitleClassName - Extra subtitle class name
 * @returns {object} Selectable card
 */
export const SelectableCardPanelCard = ({
  item,
  index,
  isSelected,
  onClick,
  onRemove,
  canRemove = true,
  icon,
  renderTitle,
  renderSubtitle,
  className,
  titleClassName,
  subtitleClassName,
}) => {
  const title = renderValue(renderTitle, item, index)
  const subtitle = renderValue(renderSubtitle, item, index)
  const cardIcon = renderIcon(icon, { className: 'svg' })
  const isRemoveVisible = renderValue(canRemove, item, index)

  return (
    <Box
      onClick={() => onClick?.(index)}
      sx={(theme) => getSelectableCardPanelCardStyles({ theme })}
      className={clsx(
        'selectable-card-panel-card',
        isSelected && 'selected',
        className
      )}
    >
      {cardIcon && <Box className="icon">{cardIcon}</Box>}
      <Box className="card-content">
        <Box className={clsx('title', titleClassName)}>{title}</Box>
        {subtitle && (
          <Box className={clsx('subtitle', subtitleClassName)}>{subtitle}</Box>
        )}
      </Box>
      {isRemoveVisible && (
        <SubmitButton
          aria-label="delete"
          className="selectable-card-panel-card-remove"
          onClick={(event) => onRemove?.(event, index)}
          iconOnly={<Trash />}
          isDestructive
          size="small"
          type="transparent"
        />
      )}
    </Box>
  )
}

SelectableCardPanelCard.propTypes = {
  item: PropTypes.any,
  index: PropTypes.number,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func,
  onRemove: PropTypes.func,
  canRemove: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
  icon: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  renderTitle: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  renderSubtitle: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  className: PropTypes.string,
  titleClassName: PropTypes.string,
  subtitleClassName: PropTypes.string,
}
