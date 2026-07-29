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

import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Component, useState } from 'react'
import { Cancel, Check, EditPencil } from 'iconoir-react'
import { unset } from 'lodash'

import {
  AttributesPanel,
  DetailsCard,
  Slider,
  StatusTag,
  TextField,
  ToggleGroup,
} from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { ClusterAPI, ProvisionAPI } from '@FeaturesModule'
import { cloneObject, filterAttributes, jsonToXml, set } from '@UtilsModule'
import { getProvisionColorState } from '@ModelsModule'

import {
  getStyles,
  OVERCOMMITMENT_ACTION_GROUP_SX,
  OVERCOMMITMENT_ACTION_SX,
} from '@modules/resources/resources/Cluster/Tabs/Info/styles'

const HIDDEN_ATTRIBUTES_REG = /^(HOST|RESERVED_CPU|RESERVED_MEM|ONE_DRS)$/
const OVERCOMMITMENT_MIN = -100
const OVERCOMMITMENT_MAX = 100
const PERCENT_UNIT = '%'

const parsePercentValue = (value) => {
  const numberValue = Number(String(value ?? '').replace(/%/g, ''))

  return Number.isFinite(numberValue) ? numberValue : 0
}

const formatPercentValue = (value) => `${value}${PERCENT_UNIT}`

const OvercommitmentValue = ({
  acceptDataCy,
  cancelDataCy,
  canEdit,
  currentValue,
  dataCy,
  editDataCy,
  handleEdit,
  inputDataCy,
  name,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(() =>
    parsePercentValue(currentValue)
  )

  const normalizeValue = (value) => {
    const numberValue = Number(value)

    if (!Number.isFinite(numberValue)) return OVERCOMMITMENT_MIN

    return Math.min(
      OVERCOMMITMENT_MAX,
      Math.max(OVERCOMMITMENT_MIN, numberValue)
    )
  }

  const handleAccept = async () => {
    await handleEdit?.(name, editValue)
    setIsEditing(false)
  }

  const handleActiveEditForm = () => {
    setEditValue(parsePercentValue(currentValue))
    setIsEditing(true)
  }

  const handleEditValueChange = (value) => setEditValue(normalizeValue(value))

  if (isEditing) {
    return (
      <Box className="overcommitment-editor">
        <Box className="overcommitment-slider">
          <Slider
            value={editValue}
            onChange={(_, value) => handleEditValueChange(value)}
            min={OVERCOMMITMENT_MIN}
            max={OVERCOMMITMENT_MAX}
            marks={[
              {
                value: OVERCOMMITMENT_MIN,
              },
              {
                value: OVERCOMMITMENT_MAX,
              },
            ]}
            valueLabelDisplay="auto"
            valueLabelFormat={formatPercentValue}
          />
          <Box className="overcommitment-slider-labels">
            <Box component="span">{formatPercentValue(OVERCOMMITMENT_MIN)}</Box>
            <Box component="span">{formatPercentValue(OVERCOMMITMENT_MAX)}</Box>
          </Box>
        </Box>
        <Box className="overcommitment-input">
          <TextField
            type="number"
            value={`${editValue}`}
            onChange={handleEditValueChange}
            postTab={PERCENT_UNIT}
            inputProps={{
              min: OVERCOMMITMENT_MIN,
              max: OVERCOMMITMENT_MAX,
              step: 1,
              'aria-label': name,
              'data-cy': inputDataCy,
            }}
          />
        </Box>
        <ToggleGroup
          size="small"
          isOutlined={false}
          isSelectable={false}
          sx={OVERCOMMITMENT_ACTION_GROUP_SX}
          options={[
            [
              {
                startIcon: <Check width="16px" height="16px" />,
                onClick: handleAccept,
                tooltip: T.Accept,
                value: 'accept',
                'data-cy': acceptDataCy,
                sx: OVERCOMMITMENT_ACTION_SX,
              },
              {
                startIcon: <Cancel width="16px" height="16px" />,
                onClick: () => setIsEditing(false),
                tooltip: T.Cancel,
                value: 'cancel',
                'data-cy': cancelDataCy,
                sx: OVERCOMMITMENT_ACTION_SX,
              },
            ],
          ]}
        />
      </Box>
    )
  }

  return (
    <Box className="overcommitment-value">
      <Box className="overcommitment-current" component="span" data-cy={dataCy}>
        {currentValue ?? '-'}
      </Box>
      {canEdit && (
        <ToggleGroup
          size="small"
          isOutlined={false}
          isSelectable={false}
          sx={OVERCOMMITMENT_ACTION_GROUP_SX}
          options={[
            [
              {
                startIcon: <EditPencil width="16px" height="16px" />,
                onClick: handleActiveEditForm,
                tooltip: T.Edit,
                value: 'edit',
                'data-cy': editDataCy,
                sx: OVERCOMMITMENT_ACTION_SX,
              },
            ],
          ]}
        />
      )}
    </Box>
  )
}

OvercommitmentValue.propTypes = {
  acceptDataCy: PropTypes.string,
  cancelDataCy: PropTypes.string,
  canEdit: PropTypes.bool,
  currentValue: PropTypes.string,
  dataCy: PropTypes.string,
  editDataCy: PropTypes.string,
  handleEdit: PropTypes.func,
  inputDataCy: PropTypes.string,
  name: PropTypes.string,
}

const OvercommitmentCard = ({ metrics = [] }) => (
  <Box className="overcommitment-card">
    <Box className="details-title">{T.Overcommitment}</Box>
    <Box className="details-container">
      {metrics.map((metric) => (
        <Box key={metric.name} className="card-detail--row">
          <Box className="card-detail--label">{metric.name}</Box>
          <Box className="overcommitment-detail--value">
            <OvercommitmentValue {...metric} />
          </Box>
        </Box>
      ))}
    </Box>
  </Box>
)

OvercommitmentCard.propTypes = {
  metrics: PropTypes.array,
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - Cluster info tab
 */
export const Info = ({ data, config }) => {
  const { selected = {}, handleRefresh, isActionsDisabled } = data || {}

  const {
    attributes_panel: attributesPanel,
    information_panel: informationPanel,
    overcommitment: overcommitmentPanel,
  } = config || {}

  const { ID, NAME, TEMPLATE = {} } = selected || {}
  const { RESERVED_CPU, RESERVED_MEM } = TEMPLATE
  const provisionId = TEMPLATE?.ONEFORM?.PROVISION_ID

  const [updateCluster, { isLoading: isUpdating }] =
    ClusterAPI.useUpdateClusterMutation()
  const { data: provision } = ProvisionAPI.useGetProvisionQuery(
    { id: provisionId },
    { skip: !provisionId }
  )

  const provisionState = provision?.TEMPLATE?.PROVISION_BODY?.state
  const isDisabled = isActionsDisabled || isUpdating

  const handleUpdateTemplate = async (template, replace = 0) => {
    if (ID === undefined) return

    await updateCluster({
      id: ID,
      template: jsonToXml(template),
      replace,
    })
    await handleRefresh?.()
  }

  const handleOvercommitmentCPU = async (_, value) => {
    await handleUpdateTemplate({ RESERVED_CPU: formatPercentValue(value) }, 1)
  }

  const handleOvercommitmentMemory = async (_, value) => {
    await handleUpdateTemplate({ RESERVED_MEM: formatPercentValue(value) }, 1)
  }

  const getAttributePayload = (attribute, newValue) =>
    typeof attribute === 'string'
      ? { key: attribute, value: newValue }
      : attribute ?? {}

  const handleAttributeInXml = async (attribute, newValue) => {
    const { key, path, value } = getAttributePayload(attribute, newValue)
    const attributePath = path ?? key

    if (!attributePath) return

    const newTemplate = cloneObject(TEMPLATE)
    set(newTemplate, attributePath, value)

    await handleUpdateTemplate(newTemplate)
  }

  const { attributes } = filterAttributes(TEMPLATE, {
    hidden: HIDDEN_ATTRIBUTES_REG,
  })

  const formattedAttributes = Object.entries(attributes ?? {}).map(
    ([key, value]) => ({ key, value })
  )

  const handleDeleteAttribute = async (index, attribute) => {
    const attributeKey = attribute?.path ?? formattedAttributes?.[index]?.key

    if (!attributeKey) return

    const newTemplate = cloneObject(TEMPLATE)
    unset(newTemplate, attributeKey)

    await handleUpdateTemplate(newTemplate)
  }

  const informationOptions = [
    [T.ID, ID ?? '-'],
    [T.Name, NAME ?? '-'],
  ]

  if (provisionId) {
    informationOptions.push([
      T.State,
      provisionState ? (
        <StatusTag
          key="cluster-provision-state"
          statusColor={getProvisionColorState(provisionState)}
          statusName={provisionState}
        />
      ) : (
        '-'
      ),
    ])
  }

  const overcommitmentMetrics = [
    {
      canEdit: overcommitmentPanel?.actions?.update_cpu === true && !isDisabled,
      currentValue: RESERVED_CPU,
      dataCy: 'allocated-cpu',
      editDataCy: 'edit-allocatedCpu',
      inputDataCy: 'text-allocatedCpu',
      acceptDataCy: 'accept-allocatedCpu',
      cancelDataCy: 'cancel-allocatedCpu',
      handleEdit: handleOvercommitmentCPU,
      name: T.ReservedCpu,
    },
    {
      canEdit:
        overcommitmentPanel?.actions?.update_memory === true && !isDisabled,
      currentValue: RESERVED_MEM,
      dataCy: 'allocated-memory',
      editDataCy: 'edit-allocatedMemory',
      inputDataCy: 'text-allocatedMemory',
      acceptDataCy: 'accept-allocatedMemory',
      cancelDataCy: 'cancel-allocatedMemory',
      handleEdit: handleOvercommitmentMemory,
      name: T.ReservedMemory,
    },
  ]

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="top-container">
        {informationPanel?.enabled && (
          <DetailsCard title={T.Information} options={informationOptions} />
        )}
        {overcommitmentPanel?.enabled && (
          <OvercommitmentCard metrics={overcommitmentMetrics} />
        )}
      </Box>
      {attributesPanel?.enabled && (
        <Box className="attributes-container">
          <AttributesPanel
            title={T.Attributes}
            attributes={formattedAttributes}
            actions={attributesPanel?.actions}
            handleEdit={handleAttributeInXml}
            handleDelete={handleDeleteAttribute}
            handleAdd={handleAttributeInXml}
            isDisabled={isDisabled}
          />
        </Box>
      )}
    </Box>
  )
}

Info.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Info.id = 'info'
Info.title = T.Info
