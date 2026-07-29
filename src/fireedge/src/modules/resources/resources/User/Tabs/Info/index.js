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
import { DetailsCard, AttributesPanel } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { UserAPI } from '@FeaturesModule'
import { Box, Stack } from '@mui/material'
import { Component, useMemo } from 'react'

import {
  booleanToString,
  cloneObject,
  filterAttributes,
  getActionsAvailable,
  jsonToXml,
  stringToBoolean,
} from '@UtilsModule'
import { getStyles } from '@modules/resources/resources/User/Tabs/Info/styles'
import {
  getUserId,
  userTabPropTypes,
} from '@modules/resources/resources/User/Tabs/common'

const { useGetUserQuery, useUpdateUserMutation } = UserAPI

const HIDDEN_ATTRIBUTES_REG =
  /^(SSH_PUBLIC_KEY|SSH_PRIVATE_KEY|SSH_PASSPHRASE|SUNSTONE|FIREEDGE)$/

const getActions = (actions = {}) =>
  getActionsAvailable(actions).reduce(
    (actionsMap, action) => ({ ...actionsMap, [action]: true }),
    {}
  )

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab slot data payload
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} User info tab
 */
export const Info = ({ data, config }) => {
  const userId = getUserId(data)
  const {
    information_panel: informationPanel,
    attributes_panel: attributesPanel,
  } = config || {}

  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation()
  const { data: user = {}, isFetching } = useGetUserQuery({ id: userId })
  const { ID, NAME, ENABLED, TEMPLATE = {} } = user

  const attributes = useMemo(() => {
    const { attributes: visibleAttributes = {} } = filterAttributes(TEMPLATE, {
      hidden: HIDDEN_ATTRIBUTES_REG,
    })

    return Object.entries(visibleAttributes).map(([key, value]) => ({
      key,
      value,
    }))
  }, [TEMPLATE])

  const handleAddAttribute = async ({ key, value }) => {
    const newTemplate = cloneObject(TEMPLATE)
    newTemplate[key] = value

    await updateUser({
      id: userId,
      template: jsonToXml(newTemplate),
      replace: 1,
    })
  }

  const handleDeleteAttribute = async (index) => {
    const key = attributes?.[index]?.key
    if (!key) return

    const newTemplate = cloneObject(TEMPLATE)
    delete newTemplate[key]

    await updateUser({
      id: userId,
      template: jsonToXml(newTemplate),
      replace: 1,
    })
  }

  const isLoading = isFetching || isUpdatingUser
  const isEnabled = stringToBoolean(ENABLED)
  const attributeActions = getActions(attributesPanel?.actions)

  return (
    <Stack key={'User-Info-Tab'} sx={(theme) => getStyles({ theme })}>
      {informationPanel?.enabled && (
        <Box>
          <DetailsCard
            title={T.Information}
            options={[
              [T.ID, ID],
              [T.Name, NAME],
              [T.Enabled, booleanToString(isEnabled)],
            ]}
          />
        </Box>
      )}
      {attributesPanel?.enabled && (
        <AttributesPanel
          title={T.Attributes}
          attributes={attributes}
          actions={{ ...attributeActions, edit: false }}
          handleAdd={handleAddAttribute}
          handleDelete={handleDeleteAttribute}
          isLoading={isLoading}
          isFullHeight={false}
        />
      )}
    </Stack>
  )
}

Info.propTypes = userTabPropTypes

Info.id = 'info'
Info.title = T.Info
