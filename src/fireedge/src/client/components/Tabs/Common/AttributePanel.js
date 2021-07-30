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
import * as React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core'

import { List } from 'client/components/Tabs/Common'
import { ACTIONS } from 'client/constants'

// This attributes has special restrictions
const SPECIAL_ATTRIBUTES = {
  VCENTER_CCR_REF: { edit: false, delete: false },
  VCENTER_HOST: { edit: false, delete: false },
  VCENTER_INSTANCE_ID: { edit: false, delete: false },
  VCENTER_PASSWORD: { edit: true, delete: false },
  VCENTER_USER: { edit: false, delete: false },
  VCENTER_VERSION: { edit: false, delete: false }
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

const AttributePanel = React.memo(({
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
      canEdit:
        actions?.includes?.(ACTIONS.EDIT_ATTRIBUTE) &&
        SPECIAL_ATTRIBUTES[name]?.edit !== false,
      canDelete:
        actions?.includes?.(ACTIONS.DELETE_ATTRIBUTE) &&
        SPECIAL_ATTRIBUTES[name]?.delete !== false,
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
      handleAdd={actions?.includes?.(ACTIONS.ADD_ATTRIBUTE) && handleAdd}
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
