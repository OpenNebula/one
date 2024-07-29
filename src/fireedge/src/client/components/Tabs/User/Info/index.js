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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'

import {
  useGetUserQuery,
  useUpdateUserMutation,
} from 'client/features/OneApi/user'
import { AttributePanel } from 'client/components/Tabs/Common'
import Information from 'client/components/Tabs/User/Info/information'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'
import * as Helper from 'client/models/Helper'
import { cloneObject, set } from 'client/utils'

const HIDDEN_ATTRIBUTES_REG =
  /^(SSH_PUBLIC_KEY|SSH_PRIVATE_KEY|SSH_PASSPHRASE|SUNSTONE|FIREEDGE)$/

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string} props.id - User id
 * @returns {ReactElement} Information tab
 */
const UserInfoTab = ({ tabProps = {}, id }) => {
  const {
    information_panel: informationPanel,
    attributes_panel: attributesPanel,
  } = tabProps

  const [updateUser] = useUpdateUserMutation()
  const { data: user = {} } = useGetUserQuery({ id })
  const { TEMPLATE } = user

  const handleAttributeInXml = async (path, newValue) => {
    const newTemplate = cloneObject(TEMPLATE)
    set(newTemplate, path, newValue)

    const xml = Helper.jsonToXml(newTemplate)
    await updateUser({ id, template: xml, replace: 0 })
  }

  const getActions = (actions) => Helper.getActionsAvailable(actions)

  const { attributes } = Helper.filterAttributes(TEMPLATE, {
    hidden: HIDDEN_ATTRIBUTES_REG,
  })

  const ATTRIBUTE_FUNCTION = {
    handleAdd: handleAttributeInXml,
    handleEdit: handleAttributeInXml,
    handleDelete: handleAttributeInXml,
  }

  return (
    <Stack
      display="grid"
      gap="1em"
      gridTemplateColumns="repeat(auto-fit, minmax(49%, 1fr))"
      padding={{ sm: '0.8em' }}
    >
      {informationPanel?.enabled && (
        <Information
          user={user}
          actions={getActions(informationPanel?.actions)}
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
    </Stack>
  )
}

UserInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

UserInfoTab.displayName = 'UserInfoTab'

export default UserInfoTab
