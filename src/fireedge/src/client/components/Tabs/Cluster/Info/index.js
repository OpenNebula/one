/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'

import {
  useGetClusterQuery,
  useUpdateClusterMutation,
} from 'client/features/OneApi/cluster'
import { AttributePanel } from 'client/components/Tabs/Common'
import Information from 'client/components/Tabs/Cluster/Info/information'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'
import {
  jsonToXml,
  getActionsAvailable,
  filterAttributes,
} from 'client/models/Helper'
import { cloneObject, set } from 'client/utils'

const HIDDEN_ATTRIBUTES_REG = /^(HOST|RESERVED_CPU|RESERVED_MEM)$/

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string} props.id - Cluster id
 * @returns {ReactElement} Information tab
 */
const ClusterInfoTab = ({ tabProps = {}, id }) => {
  const {
    information_panel: informationPanel,
    attributes_panel: attributesPanel,
  } = tabProps

  const [update] = useUpdateClusterMutation()
  const { data: cluster } = useGetClusterQuery({ id })
  const { TEMPLATE } = cluster

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

  const { attributes } = filterAttributes(TEMPLATE, {
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
          cluster={cluster}
          actions={getActions(informationPanel?.actions)}
        />
      )}
      {attributesPanel?.enabled && (
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

ClusterInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

ClusterInfoTab.displayName = 'ClusterInfoTab'

export default ClusterInfoTab
