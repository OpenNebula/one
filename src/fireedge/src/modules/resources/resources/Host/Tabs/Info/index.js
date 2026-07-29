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
/* eslint-disable react/prop-types */
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, useState } from 'react'
import { Cancel, Check, EditPencil } from 'iconoir-react'
import { unset } from 'lodash'

import {
  AttributesPanel,
  DetailsCard,
  ProgressBar,
  Slider,
  StatusTag,
  Tag,
  TextField,
  ToggleGroup,
} from '@ComponentsV2Module'
import { DatastoreAPI, HostAPI } from '@FeaturesModule'
import {
  CAPACITY_ACTION_GROUP_SX,
  CAPACITY_ACTION_SX,
  getStyles,
} from '@modules/resources/resources/Host/Tabs/Info/styles'

import { T, DS_THRESHOLD, HOST_THRESHOLD } from '@ConstantsModule'
import {
  cloneObject,
  filterAttributes,
  jsonToXml,
  prettyBytes,
  set,
} from '@UtilsModule'
import {
  getAllocatedInfo,
  getDatastoreCapacityInfo,
  getDatastores,
  getHostState,
} from '@ModelsModule'
const { useUpdateHostMutation } = HostAPI
const { useGetDatastoresQuery } = DatastoreAPI

const NSX_ATTRIBUTES_REG = /^NSX_/
const HIDDEN_ATTRIBUTES_REG =
  /^(HOST|VM|WILDS|ZOMBIES|RESERVED_CPU|RESERVED_MEM|CAPACITY)$/

const CapacityValue = ({
  canEdit,
  currentValue,
  handleEdit,
  max,
  min,
  name,
  dataCy,
  progressLabel,
  progressValue,
  thresholds,
  unit,
  unitParser,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(() => +currentValue)
  const minValue = +min
  const maxValue = +max

  const normalizeValue = (value) => {
    const numberValue = Number(value)

    if (!Number.isFinite(numberValue)) return minValue

    return Math.min(maxValue, Math.max(minValue, numberValue))
  }

  const handleAccept = async () => {
    await handleEdit?.(name, editValue)
    setIsEditing(false)
  }

  const handleActiveEditForm = () => {
    setEditValue(+currentValue)
    setIsEditing(true)
  }

  const formatMarkLabel = (value) => (unitParser ? prettyBytes(value) : value)
  const formatValueLabel = (value) =>
    unitParser ? prettyBytes(value) : `${value}${unit ? ` ${unit}` : ''}`
  const handleEditValueChange = (value) => setEditValue(normalizeValue(value))

  if (isEditing) {
    return (
      <Box className="capacity-editor">
        <Box className="capacity-slider">
          <Slider
            value={editValue}
            onChange={(_, value) => handleEditValueChange(value)}
            min={minValue}
            max={maxValue}
            marks={[
              {
                value: minValue,
              },
              {
                value: maxValue,
              },
            ]}
            valueLabelDisplay="auto"
            valueLabelFormat={formatValueLabel}
          />
          <Box className="capacity-slider-labels">
            <Box component="span">{formatMarkLabel(minValue)}</Box>
            <Box component="span">{formatMarkLabel(maxValue)}</Box>
          </Box>
        </Box>
        <Box className="capacity-input">
          <TextField
            type="number"
            value={`${editValue}`}
            onChange={handleEditValueChange}
            postTab={unit ?? ''}
            inputProps={{
              min: minValue,
              max: maxValue,
              step: 1,
              'aria-label': name,
              'data-cy': dataCy && `text-${dataCy}`,
            }}
          />
        </Box>
        <ToggleGroup
          size="small"
          isOutlined={false}
          isSelectable={false}
          sx={CAPACITY_ACTION_GROUP_SX}
          options={[
            [
              {
                startIcon: <Check width="16px" height="16px" />,
                onClick: handleAccept,
                tooltip: T.Accept,
                value: 'accept',
                'data-cy': dataCy && `accept-${dataCy}`,
                sx: CAPACITY_ACTION_SX,
              },
              {
                startIcon: <Cancel width="16px" height="16px" />,
                onClick: () => setIsEditing(false),
                tooltip: T.Cancel,
                value: 'cancel',
                sx: CAPACITY_ACTION_SX,
              },
            ],
          ]}
        />
      </Box>
    )
  }

  return (
    <Box className="capacity-value">
      <Box className="capacity-progress">
        <ProgressBar
          value={progressValue}
          label={progressLabel}
          thresholds={thresholds}
          isLabelVisible
        />
      </Box>
      {canEdit && (
        <ToggleGroup
          size="small"
          isOutlined={false}
          isSelectable={false}
          sx={CAPACITY_ACTION_GROUP_SX}
          options={[
            [
              {
                startIcon: <EditPencil width="16px" height="16px" />,
                onClick: handleActiveEditForm,
                tooltip: T.Edit,
                value: 'edit',
                'data-cy': dataCy && `edit-${dataCy}`,
                sx: CAPACITY_ACTION_SX,
              },
            ],
          ]}
        />
      )}
    </Box>
  )
}

const CapacityCard = ({ metrics = [] }) => (
  <Box className="capacity-card">
    <Box className="details-title">{T.Capacity}</Box>
    <Box className="details-container">
      {metrics.map((metric) => (
        <Box key={metric.name} className="card-detail--row">
          <Box className="card-detail--label">{metric.name}</Box>
          <Box className="capacity-detail--value">
            <CapacityValue {...metric} />
          </Box>
        </Box>
      ))}
    </Box>
  </Box>
)

const DatastoresCard = ({ datastores = [] }) => (
  <Box className="datastores-card">
    <Box className="details-title">{T.Datastores}</Box>
    <Box className="datastores-container">
      {datastores.map(({ dataCy, name, percentLabel, percentOfUsed }) => (
        <Box key={dataCy} className="datastore-row" data-cy={dataCy}>
          <Box className="datastore-label">{name}</Box>
          <Box className="datastore-progress">
            <ProgressBar
              value={percentOfUsed}
              label={percentLabel}
              thresholds={[
                DS_THRESHOLD.CAPACITY.low,
                DS_THRESHOLD.CAPACITY.high,
              ]}
              isLabelVisible
            />
          </Box>
        </Box>
      ))}
    </Box>
  </Box>
)

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.data - Tab specific data
 * @param {object} props.config - Tab view configuration
 * @returns {ReactElement} Information tab
 */
export const HostInfoTab = ({ data, config }) => {
  const { selected = {} } = data

  const {
    information_panel: informationPanel,
    attributes_panel: attributesPanel,
  } = config

  const [updateUserTemplate] = useUpdateHostMutation()
  const { data: datastores = [] } = useGetDatastoresQuery()

  const { CLUSTER, CLUSTER_ID, ID, IM_MAD, NAME, TEMPLATE, VM_MAD } = selected
  const { name: stateName = '', color: stateColor = '' } =
    getHostState(selected) ?? {}

  const {
    percentCpuUsed,
    percentCpuLabel,
    percentMemUsed,
    percentMemLabel,
    maxCpu,
    maxMem,
    totalCpu,
    totalMem,
    usageCpu,
    usageMem,
    reservedCpu,
    reservedMem,
  } = getAllocatedInfo(selected)

  const handleOvercommitmentCPU = async (name, value) => {
    let valueNumber = +value

    valueNumber === 0 && (valueNumber = usageCpu)
    const newTemplate = {
      RESERVED_CPU:
        value !== totalCpu ? totalCpu - valueNumber : reservedCpu ? 0 : '',
    }

    newTemplate &&
      (await updateUserTemplate({
        id: ID,
        template: jsonToXml(newTemplate),
        replace: 1,
      }))
  }

  const handleOvercommitmentMemory = async (name, value) => {
    let valueNumber = +value

    valueNumber === 0 && (valueNumber = usageMem)
    const newTemplate = {
      RESERVED_MEM:
        value !== totalMem ? totalMem - valueNumber : reservedMem ? 0 : '',
    }

    newTemplate &&
      (await updateUserTemplate({
        id: ID,
        template: jsonToXml(newTemplate),
        replace: 1,
      }))
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

    const xml = jsonToXml(newTemplate)
    await updateUserTemplate({ id: ID, template: xml, replace: 0 })
  }

  const { attributes } = filterAttributes(TEMPLATE, {
    extra: {
      nsx: NSX_ATTRIBUTES_REG,
    },
    hidden: HIDDEN_ATTRIBUTES_REG,
  })

  const formattedAttributes = Object.entries(attributes ?? {}).map(
    ([key, value]) => ({ key, value })
  )

  const handleDeleteAttribute = async (index, attribute) => {
    const newTemplate = cloneObject(TEMPLATE)
    const attributeKey = attribute?.path ?? formattedAttributes?.[index]?.key

    if (!attributeKey) return
    unset(newTemplate, attributeKey)

    const xml = jsonToXml(newTemplate)
    await updateUserTemplate({ id: ID, template: xml, replace: 0 })
  }

  const capacity = [
    {
      name: T.AllocatedCpu,
      dataCy: 'allocatedCpu',
      handleEdit: handleOvercommitmentCPU,
      canEdit: true,
      progressValue: percentCpuUsed,
      progressLabel: percentCpuLabel,
      thresholds: [HOST_THRESHOLD.CPU.low, HOST_THRESHOLD.CPU.high],
      min: '0',
      max: `${totalCpu * 2}`,
      currentValue: maxCpu,
      title: T.Overcommitment,
    },
    {
      name: T.AllocatedMemory,
      dataCy: 'allocatedMemory',
      handleEdit: handleOvercommitmentMemory,
      canEdit: true,
      progressValue: percentMemUsed,
      progressLabel: percentMemLabel,
      thresholds: [HOST_THRESHOLD.MEMORY.low, HOST_THRESHOLD.MEMORY.high],
      min: '0',
      max: `${totalMem * 2}`,
      currentValue: maxMem,
      unit: 'KB',
      unitParser: true,
      title: T.Overcommitment,
    },
  ]

  const infoFromDatastores = getDatastores(selected).map((dsHost) => {
    const { percentOfUsed, percentLabel } = getDatastoreCapacityInfo(dsHost)
    const dsName = datastores.find((ds) => +ds.ID === +dsHost.ID)?.NAME ?? '--'

    return {
      name: `#${dsHost.ID} ${dsName}`,
      dataCy: `ds-id-${dsHost.ID}`,
      percentLabel,
      percentOfUsed,
    }
  })

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="top-container">
        {informationPanel?.enabled && (
          <DetailsCard
            title={T.Information}
            options={[
              [T.ID, ID],
              [T.Name, NAME],
              [
                T.State,
                <StatusTag
                  key="host-state"
                  dataCy="state"
                  statusName={stateName}
                  statusColor={stateColor}
                />,
              ],
              [T.Cluster, `#${CLUSTER_ID} ${CLUSTER}`],
              [T.IM_MAD, <Tag key="host-im-mad" title={IM_MAD} />],
              [T.VM_MAD, <Tag key="host-vm-mad" title={VM_MAD} />],
            ]}
          />
        )}
        <CapacityCard metrics={capacity} />
      </Box>
      {infoFromDatastores?.length > 0 && (
        <DatastoresCard datastores={infoFromDatastores} />
      )}
      {attributesPanel?.enabled && attributes && (
        <AttributesPanel
          title={T.Attributes}
          attributes={formattedAttributes}
          actions={attributesPanel?.actions}
          handleEdit={handleAttributeInXml}
          handleDelete={handleDeleteAttribute}
          handleAdd={handleAttributeInXml}
        />
      )}
    </Box>
  )
}

HostInfoTab.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

HostInfoTab.displayName = 'HostInfoTab'
HostInfoTab.id = 'info'
HostInfoTab.title = T.Info
