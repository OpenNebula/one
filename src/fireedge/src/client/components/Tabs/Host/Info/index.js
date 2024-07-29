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
import Information from 'client/components/Tabs/Host/Info/information'
import {
  useGetHostQuery,
  useUpdateHostMutation,
} from 'client/features/OneApi/host'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'
import {
  filterAttributes,
  getActionsAvailable,
  jsonToXml,
} from 'client/models/Helper'
import { cloneObject, set } from 'client/utils'

const NSX_ATTRIBUTES_REG = /^NSX_/
const HIDDEN_ATTRIBUTES_REG =
  /^(HOST|VM|WILDS|ZOMBIES|RESERVED_CPU|RESERVED_MEM|EC2_ACCESS|EC2_SECRET|CAPACITY|REGION_NAME)$/

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string} props.id - Host id
 * @returns {ReactElement} Information tab
 */
const HostInfoTab = ({ tabProps = {}, id }) => {
  const {
    information_panel: informationPanel,
    nsx_panel: nsxPanel,
    attributes_panel: attributesPanel,
  } = tabProps

  const [updateUserTemplate] = useUpdateHostMutation()
  const { data: host = {} } = useGetHostQuery({ id })
  const { TEMPLATE } = host

  const handleAttributeInXml = async (path, newValue) => {
    const newTemplate = cloneObject(TEMPLATE)
    set(newTemplate, path, newValue)

    const xml = jsonToXml(newTemplate)
    await updateUserTemplate({ id, template: xml, replace: 0 })
  }

  const getActions = useCallback(
    (actions) => getActionsAvailable(actions),
    [getActionsAvailable]
  )

  const { attributes, nsx: nsxAttributes } = filterAttributes(TEMPLATE, {
    extra: {
      nsx: NSX_ATTRIBUTES_REG,
    },
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
          actions={getActions(informationPanel?.actions)}
          host={host}
        />
      )}
      {attributesPanel?.enabled && attributes && (
        <AttributePanel
          {...ATTRIBUTE_FUNCTION}
          attributes={attributes}
          actions={getActions(attributesPanel?.actions)}
          title={Tr(T.Attributes)}
          fullWidth={true}
        />
      )}
      {nsxPanel?.enabled && nsxAttributes && (
        <AttributePanel
          {...ATTRIBUTE_FUNCTION}
          actions={getActions(nsxPanel?.actions)}
          attributes={nsxAttributes}
          title={`NSX ${Tr(T.Information)}`}
        />
      )}
    </Stack>
  )
}

HostInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

HostInfoTab.displayName = 'HostInfoTab'

export default HostInfoTab
