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

import { AttributesPanel } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { VdcAPI } from '@FeaturesModule'
import { Stack } from '@mui/material'
import { Component, useMemo } from 'react'

import {
  cloneObject,
  filterAttributes,
  getActionsAvailable,
  jsonToXml,
} from '@UtilsModule'
import { getStyles } from '@modules/resources/resources/Vdc/Tabs/Info/styles'
import {
  getVdcId,
  vdcTabPropTypes,
} from '@modules/resources/resources/Vdc/Tabs/common'

const { useGetVDCQuery, useUpdateVDCMutation } = VdcAPI

const getActions = (actions = {}) =>
  getActionsAvailable(actions).reduce(
    (actionsMap, action) => ({ ...actionsMap, [action]: true }),
    {}
  )

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab slot data payload
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} VDC info tab
 */
export const Info = ({ data, config }) => {
  const vdcId = getVdcId(data)
  const { attributes_panel: attributesPanel } = config || {}

  const [updateVdc, { isLoading: isUpdatingVdc }] = useUpdateVDCMutation()
  const { data: vdc = {}, isFetching } = useGetVDCQuery({ id: vdcId })
  const { TEMPLATE = {} } = vdc

  const attributes = useMemo(() => {
    const { attributes: visibleAttributes = {} } = filterAttributes(TEMPLATE)

    return Object.entries(visibleAttributes).map(([key, value]) => ({
      key,
      value,
    }))
  }, [TEMPLATE])

  const handleAddAttribute = async ({ key, value }) => {
    const newTemplate = cloneObject(TEMPLATE)
    newTemplate[key] = value

    await updateVdc({
      id: vdcId,
      template: jsonToXml(newTemplate),
      replace: 0,
    })
  }

  const handleDeleteAttribute = async (index) => {
    const key = attributes?.[index]?.key
    if (!key) return

    const newTemplate = cloneObject(TEMPLATE)
    delete newTemplate[key]

    await updateVdc({
      id: vdcId,
      template: jsonToXml(newTemplate),
      replace: 0,
    })
  }

  const isLoading = isFetching || isUpdatingVdc
  const attributeActions = getActions(attributesPanel?.actions)

  return (
    <Stack key={'VDC-Info-Tab'} sx={(theme) => getStyles({ theme })}>
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

Info.propTypes = vdcTabPropTypes

Info.id = 'info'
Info.title = T.Info
