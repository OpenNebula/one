/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { memo } from 'react'
import PropTypes from 'prop-types'
import makeStyles from '@mui/styles/makeStyles'

import { List } from 'client/components/Tabs/Common'
import { ACTIONS } from 'client/constants'

const {
  COPY_ATTRIBUTE: COPY,
  ADD_ATTRIBUTE: ADD,
  EDIT_ATTRIBUTE: EDIT,
  DELETE_ATTRIBUTE: DELETE
} = ACTIONS

// This attributes has special restrictions
const SPECIAL_ATTRIBUTES = {
  VCENTER_CCR_REF: {
    [EDIT]: false,
    [DELETE]: false
  },
  VCENTER_HOST: {
    [EDIT]: false,
    [DELETE]: false
  },
  VCENTER_INSTANCE_ID: {
    [EDIT]: false,
    [DELETE]: false
  },
  VCENTER_PASSWORD: {
    [EDIT]: true,
    [DELETE]: false
  },
  VCENTER_USER: {
    [EDIT]: false,
    [DELETE]: false
  },
  VCENTER_VERSION: {
    [EDIT]: false,
    [DELETE]: false
  }
}

const useStyles = makeStyles({
  container: {
    gridColumn: '1 / -1'
  },
  item: {
    '& > *:first-child': {
      flex: '1 1 20%'
    }
  }
})

const AttributePanel = memo(({
  title,
  attributes = {},
  handleEdit,
  handleDelete,
  handleAdd,
  actions
}) => {
  const classes = useStyles()

  const formatAttributes = Object.entries(attributes)
    .map(([name, value]) => ({
      name,
      value,
      showActionsOnHover: true,
      canCopy:
        actions?.includes?.(COPY) && !SPECIAL_ATTRIBUTES[name]?.[COPY],
      canEdit:
        actions?.includes?.(EDIT) && !SPECIAL_ATTRIBUTES[name]?.[EDIT],
      canDelete:
        actions?.includes?.(DELETE) && !SPECIAL_ATTRIBUTES[name]?.[DELETE],
      handleEdit,
      handleDelete
    }))

  return (
    <List
      containerProps={{ className: classes.container }}
      itemProps={{ dense: true, className: classes.item }}
      subListProps={{ disablePadding: true }}
      title={title}
      list={formatAttributes}
      handleAdd={actions?.includes?.(ADD) && handleAdd}
    />
  )
})

AttributePanel.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  attributes: PropTypes.object,
  handleAdd: PropTypes.func,
  handleEdit: PropTypes.func,
  handleDelete: PropTypes.func,
  title: PropTypes.string
}

AttributePanel.displayName = 'AttributePanel'

export default AttributePanel
