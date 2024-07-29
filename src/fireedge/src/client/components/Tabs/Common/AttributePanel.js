/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import makeStyles from '@mui/styles/makeStyles'
import PropTypes from 'prop-types'
import { memo, useCallback } from 'react'

import { List } from 'client/components/Tabs/Common'
import { ACTIONS } from 'client/constants'

const {
  COPY_ATTRIBUTE: COPY,
  ADD_ATTRIBUTE: ADD,
  EDIT_ATTRIBUTE: EDIT,
  DELETE_ATTRIBUTE: DELETE,
} = ACTIONS

const ALL_ACTIONS = [COPY, ADD, EDIT, DELETE]

// This attributes has special restrictions
const SPECIAL_ATTRIBUTES = {
  VCENTER_CCR_REF: {
    [EDIT]: false,
    [DELETE]: false,
  },
  VCENTER_HOST: {
    [EDIT]: false,
    [DELETE]: false,
  },
  VCENTER_INSTANCE_ID: {
    [EDIT]: false,
    [DELETE]: false,
  },
  VCENTER_PASSWORD: {
    [DELETE]: false,
  },
  VCENTER_USER: {
    [EDIT]: false,
    [DELETE]: false,
  },
  VCENTER_VERSION: {
    [EDIT]: false,
    [DELETE]: false,
  },
}

const useStyles = makeStyles({
  container: {
    gridColumn: '1 / -1',
  },
  item: {
    '& > *:first-child': {
      flex: '1 1 20%',
    },
  },
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
    const classes = useStyles()

    const canUseAction = useCallback(
      (name, action) =>
        actions?.includes?.(action) &&
        (!filtersSpecialAttributes ||
          SPECIAL_ATTRIBUTES[name]?.[action] === undefined),
      [actions?.length]
    )

    const formatAttributes = Object.entries(attributes).map(
      ([name, value]) => ({
        name,
        value,
        showActionsOnHover: true,
        canCopy: canUseAction(name, COPY),
        canEdit: canUseAction(name, EDIT),
        canDelete: canUseAction(name, DELETE),
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
