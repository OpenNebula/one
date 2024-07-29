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

import { useRenameDatastoreMutation } from 'client/features/OneApi/datastore'
import { StatusChip, LinearProgressWithLabel } from 'client/components/Status'
import { List } from 'client/components/Tabs/Common'

import { getState, getType, getCapacityInfo } from 'client/models/Datastore'
import { stringToBoolean } from 'client/models/Helper'
import { prettyBytes } from 'client/utils'
import { T, Datastore, DATASTORE_ACTIONS, DS_THRESHOLD } from 'client/constants'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {Datastore} props.datastore - datastore resource
 * @param {string[]} props.actions - Available actions to information tab
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ datastore = {}, actions }) => {
  const [rename] = useRenameDatastoreMutation()

  const { ID, NAME, BASE_PATH, TEMPLATE } = datastore

  const isShared = stringToBoolean(TEMPLATE.SHARED)
  const limit =
    !isShared && TEMPLATE.LIMIT_MB ? prettyBytes(TEMPLATE.LIMIT_MB, 'MB') : '-'

  const { percentOfUsed, percentLabel } = getCapacityInfo(datastore)
  const { color: stateColor, name: stateName } = getState(datastore)
  const dsTypeName = getType(datastore)

  const handleRename = async (_, newName) => {
    await rename({ id: ID, name: newName })
  }

  const info = [
    { name: T.ID, value: ID, dataCy: 'id' },
    {
      name: T.Name,
      value: NAME,
      dataCy: 'name',
      canEdit: actions?.includes?.(DATASTORE_ACTIONS.RENAME),
      handleEdit: handleRename,
    },
    {
      name: T.State,
      value: <StatusChip text={stateName} stateColor={stateColor} />,
      dataCy: 'state',
    },
    { name: T.Type, value: dsTypeName, dataCy: 'type' },
    { name: T.BasePath, value: BASE_PATH, dataCy: 'base_path' },
    {
      name: T.Capacity,
      value: (
        <LinearProgressWithLabel
          value={percentOfUsed}
          label={percentLabel}
          high={DS_THRESHOLD.CAPACITY.high}
          low={DS_THRESHOLD.CAPACITY.low}
        />
      ),
      dataCy: 'capacity',
    },
    { name: T.Limit, value: limit, dataCy: 'limit' },
  ]

  return (
    <>
      <List
        title={T.Information}
        list={info}
        containerProps={{ sx: { gridRow: 'span 2' } }}
      />
    </>
  )
}

InformationPanel.propTypes = {
  datastore: PropTypes.object,
  actions: PropTypes.arrayOf(PropTypes.string),
}

InformationPanel.displayName = 'InformationPanel'

export default InformationPanel
