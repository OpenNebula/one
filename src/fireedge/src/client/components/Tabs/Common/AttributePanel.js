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

import { List } from 'client/components/Tabs/Common'
import { ACTIONS } from 'client/constants'

const AttributePanel = React.memo((
  { title, attributes, handleEdit, handleDelete, handleAdd, actions }
) => {
  const formatAttributes = Object.entries(attributes)
    .filter(([_, value]) => typeof value === 'string')
    .map(([name, value]) => ({
      name,
      value,
      canEdit: actions?.includes?.(ACTIONS.EDIT_ATTRIBUTE),
      canDelete: actions?.includes?.(ACTIONS.DELETE_ATTRIBUTE),
      handleEdit,
      handleDelete
    }))

  return (
    <List
      title={title}
      list={formatAttributes}
      {...(actions?.includes?.(ACTIONS.ADD_ATTRIBUTE) && {
        handleAdd
      })}
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
