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
import { css } from '@emotion/css'
import { useMemo, memo, useCallback } from 'react'
import { useTheme } from '@mui/material'
import PropTypes from 'prop-types'

import { List } from '@modules/components/Tabs/Common'
import { ACTIONS } from '@ConstantsModule'

const {
  COPY_ATTRIBUTE: COPY,
  ADD_ATTRIBUTE: ADD,
  EDIT_ATTRIBUTE: EDIT,
  DELETE_ATTRIBUTE: DELETE,
} = ACTIONS

const ALL_ACTIONS = [COPY, ADD, EDIT, DELETE]

const useStyles = () => ({
  container: css({
    gridColumn: '1 / -1',
  }),
  item: css({
    '& > *:first-child': {
      flex: '1 1 20%',
    },
  }),
})

const AttributePanel = memo(
  ({
    title,
    attributes = {},
    handleEdit,
    handleDelete,
    handleAdd,
    allActionsEnabled = true,
    actions = allActionsEnabled ? ALL_ACTIONS : [],
    filtersSpecialAttributes = true,
    collapse = false,
    askToDelete = true,
    fullWidth = false,
  }) => {
    const theme = useTheme()
    const classes = useMemo(() => useStyles(theme), [theme])

    const canUseAction = useCallback(
      (action) => actions?.includes?.(action) && !filtersSpecialAttributes,
      [actions?.length]
    )

    const formatAttributes = Object.entries(attributes).map(
      ([name, value]) => ({
        name,
        value,
        showActionsOnHover: true,
        canCopy: canUseAction(COPY),
        canEdit: canUseAction(EDIT),
        canDelete: canUseAction(DELETE),
        handleEdit,
        handleDelete,
        askToDelete,
        fullWidth,
      })
    )

    return (
      <List
        containerProps={{ className: classes.container }}
        itemProps={{ dense: true, className: classes.item }}
        subListProps={{ disablePadding: true }}
        title={title}
        list={formatAttributes}
        handleAdd={actions?.includes?.(ADD) && handleAdd}
        collapse={collapse}
      />
    )
  }
)

AttributePanel.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  attributes: PropTypes.object,
  handleAdd: PropTypes.func,
  handleEdit: PropTypes.func,
  handleDelete: PropTypes.func,
  title: PropTypes.any,
  filtersSpecialAttributes: PropTypes.bool,
  allActionsEnabled: PropTypes.bool,
  collapse: PropTypes.bool,
  askToDelete: PropTypes.bool,
  fullWidth: PropTypes.bool,
}

AttributePanel.displayName = 'AttributePanel'

export default AttributePanel
