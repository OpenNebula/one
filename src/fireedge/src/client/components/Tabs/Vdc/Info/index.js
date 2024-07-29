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
  useGetVDCQuery,
  useUpdateVDCMutation,
} from 'client/features/OneApi/vdc'
import Information from 'client/components/Tabs/Vdc/Info/information'
import {
  filterAttributes,
  getActionsAvailable,
  jsonToXml,
} from 'client/models/Helper'
import { AttributePanel } from 'client/components/Tabs/Common'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'
import { cloneObject, set } from 'client/utils'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string} props.id - Template id
 * @returns {ReactElement} Information tab
 */
const VDCInfoTab = ({ tabProps = {}, id }) => {
  const {
    information_panel: informationPanel,
    attributes_panel: attributesPanel,
  } = tabProps

  const { data: vdc = {} } = useGetVDCQuery({ id })
  const { TEMPLATE } = vdc
  const [updateTemplate] = useUpdateVDCMutation()

  const getActions = (actions) => getActionsAvailable(actions)

  const { attributes } = filterAttributes(TEMPLATE)

  const handleAttributeInXml = async (path, newValue) => {
    const newTemplate = cloneObject(TEMPLATE)
    set(newTemplate, path, newValue)

    const xml = jsonToXml(newTemplate)
    await updateTemplate({ id, template: xml, replace: 0 })
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
          vdc={vdc}
        />
      )}
      {attributesPanel?.enabled && (
        <AttributePanel
          attributes={attributes}
          actions={getActions(attributesPanel?.actions)}
          title={Tr(T.Attributes)}
          handleAdd={handleAttributeInXml}
          handleEdit={handleAttributeInXml}
          handleDelete={handleAttributeInXml}
        />
      )}
    </Stack>
  )
}

VDCInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

VDCInfoTab.displayName = 'VDCInfoTab'

export default VDCInfoTab
