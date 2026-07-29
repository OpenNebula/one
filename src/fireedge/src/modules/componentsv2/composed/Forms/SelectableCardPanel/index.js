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
import { Box, List } from '@mui/material'
import { Plus } from 'iconoir-react'
import { STYLE_BUTTONS } from '@ConstantsModule'

import { SubmitButton } from '@modules/componentsv2/primitives/Buttons/Submit'
import { SelectableCardPanelCard } from '@modules/componentsv2/composed/Forms/SelectableCardPanel/Card'
import { getSelectableCardPanelStyles } from '@modules/componentsv2/composed/Forms/SelectableCardPanel/styles'

export * from '@modules/componentsv2/composed/Forms/SelectableCardPanel/Card'

/**
 * Resolves a plain value or getter function.
 *
 * @param {Function|*} getter - Value or getter
 * @param {...*} args - Getter arguments
 * @returns {*} Resolved value
 */
const getValue = (getter, ...args) =>
  typeof getter === 'function' ? getter(...args) : getter

/**
 * Split panel with selectable cards on the left and active content on the right.
 *
 * @param {object} props - Component props
 * @param {Array} props.items - Selectable items
 * @param {number} props.selectedIndex - Selected item index
 * @param {Function} props.onSelect - Select handler
 * @param {Function} props.onAdd - Add handler
 * @param {Function} props.onRemove - Remove handler
 * @param {boolean|Function} props.canRemove - Remove visibility
 * @param {boolean} props.allowRemoveAll - Whether all items can be removed
 * @param {string|object} props.addLabel - Add button label
 * @param {string} props.addButtonCy - Add button Cypress selector
 * @param {Function} props.getItemKey - Item key resolver
 * @param {*} props.cardIcon - Card icon
 * @param {Function|*} props.renderCardTitle - Card title renderer
 * @param {Function|*} props.renderCardSubtitle - Card subtitle renderer
 * @param {boolean} props.showSidebar - Show sidebar
 * @param {number} props.sidebarSize - Sidebar size in percentage
 * @param {string} props.sidebarPosition - Sidebar render position
 * @param {string} props.className - Extra root class name
 * @param {object} props.children - Right area content
 * @returns {object} Selectable card panel
 */
export const SelectableCardPanel = ({
  items = [],
  selectedIndex,
  onSelect,
  onAdd,
  onRemove,
  canRemove = true,
  allowRemoveAll = true,
  addLabel,
  addButtonCy,
  getItemKey,
  cardIcon,
  renderCardTitle,
  renderCardSubtitle,
  showSidebar = true,
  sidebarSize = 30,
  sidebarPosition = 'left',
  className,
  children,
}) => {
  const sidebar = showSidebar && (
    <Box className="sidebar">
      <SubmitButton
        type={STYLE_BUTTONS.TYPE.SECONDARY}
        data-cy={addButtonCy}
        onClick={onAdd}
        label={addLabel}
        startIcon={<Plus width="16px" height="16px" />}
      />
      <List className={clsx('sidebar-list')}>
        {items?.map((item, idx) => {
          const canRemoveItem =
            (allowRemoveAll || items.length > 1) &&
            getValue(canRemove, item, idx)

          return (
            <SelectableCardPanelCard
              key={getValue(getItemKey, item, idx) ?? `${idx}-${item?.id}`}
              item={item}
              index={idx}
              isSelected={idx === selectedIndex}
              onClick={onSelect}
              onRemove={onRemove}
              canRemove={canRemoveItem}
              icon={cardIcon}
              renderTitle={renderCardTitle}
              renderSubtitle={renderCardSubtitle}
            />
          )
        })}
      </List>
    </Box>
  )

  return (
    <Box
      className={clsx('selectable-card-panel', className)}
      sx={(theme) =>
        getSelectableCardPanelStyles({
          theme,
          sidebarSize,
          sidebarPosition,
        })
      }
    >
      {sidebar}
      <Box className="panel">{children}</Box>
    </Box>
  )
}

SelectableCardPanel.propTypes = {
  items: PropTypes.array,
  selectedIndex: PropTypes.number,
  onSelect: PropTypes.func,
  onAdd: PropTypes.func,
  onRemove: PropTypes.func,
  canRemove: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
  allowRemoveAll: PropTypes.bool,
  addLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  addButtonCy: PropTypes.string,
  getItemKey: PropTypes.func,
  cardIcon: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  renderCardTitle: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  renderCardSubtitle: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  showSidebar: PropTypes.bool,
  sidebarSize: PropTypes.number,
  sidebarPosition: PropTypes.oneOf(['left', 'bottom']),
  className: PropTypes.string,
  children: PropTypes.node,
}
