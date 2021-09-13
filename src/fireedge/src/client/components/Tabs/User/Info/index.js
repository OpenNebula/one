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
/* eslint-disable jsdoc/require-jsdoc */
import { useContext } from 'react'
import PropTypes from 'prop-types'

import { useUserApi } from 'client/features/One'
import { TabContext } from 'client/components/Tabs/TabProvider'
import { AttributePanel } from 'client/components/Tabs/Common'
import Information from 'client/components/Tabs/User/Info/information'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'
import * as Helper from 'client/models/Helper'
import { cloneObject, set } from 'client/utils'

const HIDDEN_ATTRIBUTES_REG = /^(SSH_PUBLIC_KEY|SSH_PRIVATE_KEY|SSH_PASSPHRASE|SUNSTONE|FIREEDGE)$/

const UserInfoTab = ({ tabProps = {} }) => {
  const {
    information_panel: informationPanel,
    attributes_panel: attributesPanel
  } = tabProps

  const { updateUser } = useUserApi()
  const { handleRefetch, data: user = {} } = useContext(TabContext)
  const { ID, TEMPLATE } = user

  const handleAttributeInXml = async (path, newValue) => {
    const newTemplate = cloneObject(TEMPLATE)

    set(newTemplate, path, newValue)

    const xml = Helper.jsonToXml(newTemplate)

    // 0: Replace the whole template
    const response = await updateUser(ID, xml, 0)

    String(response) === String(ID) && await handleRefetch?.()
  }

  const getActions = actions => Helper.getActionsAvailable(actions)

  const { attributes } = Helper.filterAttributes(TEMPLATE, { hidden: HIDDEN_ATTRIBUTES_REG })

  const ATTRIBUTE_FUNCTION = {
    handleAdd: handleAttributeInXml,
    handleEdit: handleAttributeInXml,
    handleDelete: handleAttributeInXml
  }

  return (
    <div style={{
      display: 'grid',
      gap: '1em',
      gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
      padding: '0.8em'
    }}>
      {informationPanel?.enabled && (
        <Information
          actions={getActions(informationPanel?.actions)}
          user={user}
        />
      )}
      {attributesPanel?.enabled && attributes && (
        <AttributePanel
          {...ATTRIBUTE_FUNCTION}
          attributes={attributes}
          actions={getActions(attributesPanel?.actions)}
          title={Tr(T.Attributes)}
        />
      )}
    </div>
  )
}

UserInfoTab.propTypes = {
  tabProps: PropTypes.object
}

UserInfoTab.displayName = 'UserInfoTab'

export default UserInfoTab
