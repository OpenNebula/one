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
import { Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, useCallback } from 'react'

import { AttributePanel } from 'client/components/Tabs/Common'
import Information from 'client/components/Tabs/Zone/Info/information'
import ServerPool from 'client/components/Tabs/Zone/Info/ServerPool'
import {
  useGetZoneQuery,
  useUpdateZoneMutation,
} from 'client/features/OneApi/zone'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'
import { getActionsAvailable, jsonToXml } from 'client/models/Helper'
import { cloneObject, set } from 'client/utils'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string} props.id - Zone id
 * @returns {ReactElement} Information tab
 */
const ZoneInfoTab = ({ tabProps = {}, id }) => {
  const {
    information_panel: informationPanel,
    attributes_panel: attributesPanel,
    server_pool_panel: serverPoolPanel,
  } = tabProps

  const [update] = useUpdateZoneMutation()
  const { data: zone = {} } = useGetZoneQuery(id)
  const { TEMPLATE } = zone

  const handleAttributeInXml = async (path, newValue) => {
    const newTemplate = cloneObject(TEMPLATE)
    set(newTemplate, path, newValue)

    const xml = jsonToXml(newTemplate)
    await update({ id, template: xml, replace: 0 })
  }

  const getActions = useCallback(
    (actions) => getActionsAvailable(actions),
    [getActionsAvailable]
  )

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
          zone={zone}
          actions={getActions(informationPanel?.actions)}
        />
      )}
      {serverPoolPanel?.enabled && <ServerPool zone={zone} />}
      {attributesPanel?.enabled && (
        <AttributePanel
          {...ATTRIBUTE_FUNCTION}
          attributes={TEMPLATE}
          actions={getActions(attributesPanel?.actions)}
          title={Tr(T.Attributes)}
          fullWidth={true}
        />
      )}
    </Stack>
  )
}

ZoneInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

ZoneInfoTab.displayName = 'ZoneInfoTab'

export default ZoneInfoTab
