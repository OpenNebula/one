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

import { useHostApi } from 'client/features/One'
import { TabContext } from 'client/components/Tabs/TabProvider'
import { AttributePanel } from 'client/components/Tabs/Common'
import Information from 'client/components/Tabs/Host/Info/information'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'
import * as Helper from 'client/models/Helper'
import { cloneObject, set } from 'client/utils'

const NSX_ATTRIBUTES_REG = /^NSX_/
const VCENTER_ATTRIBUTES_REG = /^VCENTER_(?!(RESOURCE_POOL)$)/
const HIDDEN_ATTRIBUTES_REG = /^(HOST|VM|WILDS|ZOMBIES|RESERVED_CPU|RESERVED_MEM|EC2_ACCESS|EC2_SECRET|CAPACITY|REGION_NAME)$/

const HostInfoTab = ({ tabProps = {} }) => {
  const {
    information_panel: informationPanel,
    vcenter_panel: vcenterPanel,
    nsx_panel: nsxPanel,
    attributes_panel: attributesPanel
  } = tabProps

  const { rename, updateUserTemplate } = useHostApi()
  const { handleRefetch, data: host = {} } = useContext(TabContext)
  const { ID, TEMPLATE } = host

  const handleRename = async newName => {
    const response = await rename(ID, newName)
    String(response) === String(ID) && await handleRefetch?.()
  }

  const handleAttributeInXml = async (path, newValue) => {
    const newTemplate = cloneObject(TEMPLATE)

    set(newTemplate, path, newValue)

    const xml = Helper.jsonToXml(newTemplate)

    // 0: Replace the whole template
    const response = await updateUserTemplate(ID, xml, 0)

    String(response) === String(ID) && await handleRefetch?.()
  }

  const getActions = actions => Helper.getActionsAvailable(actions)

  const {
    attributes,
    nsx: nsxAttributes,
    vcenter: vcenterAttributes
  } = Helper.filterAttributes(TEMPLATE, {
    extra: {
      vcenter: VCENTER_ATTRIBUTES_REG,
      nsx: NSX_ATTRIBUTES_REG
    },
    hidden: HIDDEN_ATTRIBUTES_REG
  })

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
          handleRename={handleRename}
          host={host}
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
      {vcenterPanel?.enabled && vcenterAttributes && (
        <AttributePanel
          {...ATTRIBUTE_FUNCTION}
          actions={getActions(vcenterPanel?.actions)}
          attributes={vcenterAttributes}
          title={`vCenter ${Tr(T.Information)}`}
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
    </div>
  )
}

HostInfoTab.propTypes = {
  tabProps: PropTypes.object
}

HostInfoTab.displayName = 'HostInfoTab'

export default HostInfoTab
