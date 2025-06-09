/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'
import { ReactElement } from 'react'
import { generatePath } from 'react-router-dom'

import { ImageAPI } from '@FeaturesModule'
import { StatusChip } from '@modules/components/Status'
import { List } from '@modules/components/Tabs/Common'

import { Image, IMAGE_ACTIONS, IMAGE_TYPES, T } from '@ConstantsModule'
import {
  booleanToString,
  getDiskType,
  getImageState,
  getImageType,
  levelLockToString,
  timeToString,
} from '@ModelsModule'
import { PATH } from '@modules/components/path'
import { arrayToOptions, prettyBytes } from '@UtilsModule'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {Image} props.image - Image resource
 * @param {string[]} props.actions - Available actions to information tab
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ image = {}, actions }) => {
  const [rename] = ImageAPI.useRenameImageMutation()
  const [changeType] = ImageAPI.useChangeImageTypeMutation()
  const [persistent] = ImageAPI.usePersistentImageMutation()

  const {
    ID,
    NAME,
    SIZE,
    PERSISTENT,
    LOCK,
    REGTIME,
    DATASTORE_ID,
    DATASTORE = '--',
    VMS,
  } = image

  const { color: stateColor, name: stateName } = getImageState(image)
  const imageTypeName = getImageType(image)
  const imageDiskTypeName = getDiskType(image)

  const handleRename = async (_, newName) => {
    await rename({ id: ID, name: newName })
  }

  const handleChangeType = async (_, newType) => {
    await changeType({ id: ID, type: newType })
  }

  const handleChangePersistent = async (_, newPersistent) => {
    await persistent({ id: ID, persistent: !!+newPersistent })
  }

  const getImageTypeOptions = () =>
    arrayToOptions(IMAGE_TYPES, { addEmpty: false })

  const getPersistentOptions = () =>
    arrayToOptions([0, 1], {
      addEmpty: false,
      getText: booleanToString,
      getValue: String,
    })

  const info = [
    { name: T.ID, value: ID, dataCy: 'id' },
    {
      name: T.Name,
      value: NAME,
      dataCy: 'name',
      canEdit: actions?.includes?.(IMAGE_ACTIONS.RENAME),
      handleEdit: handleRename,
    },
    DATASTORE_ID && {
      name: T.Datastore,
      value: `#${DATASTORE_ID} ${DATASTORE}`,
      link:
        !Number.isNaN(+DATASTORE_ID) &&
        generatePath(PATH.STORAGE.DATASTORES.DETAIL, { id: DATASTORE_ID }),
      dataCy: 'datastoreId',
    },
    {
      name: T.RegistrationTime,
      value: timeToString(REGTIME),
      dataCy: 'regtime',
    },
    {
      name: T.Type,
      value: imageTypeName,
      valueInOptionList: imageTypeName,
      handleGetOptionList: getImageTypeOptions,
      handleEdit: handleChangeType,
      dataCy: 'type',
    },
    {
      name: T.DiskType,
      value: imageDiskTypeName,
      valueInOptionList: imageDiskTypeName,
      dataCy: 'diskType',
    },
    {
      name: T.Locked,
      value: levelLockToString(LOCK?.LOCKED),
      dataCy: 'locked',
    },
    {
      name: T.Persistent,
      value: booleanToString(+PERSISTENT),
      valueInOptionList: PERSISTENT,
      canEdit: actions?.includes?.(IMAGE_ACTIONS.CHANGE_PERS),
      handleGetOptionList: getPersistentOptions,
      handleEdit: handleChangePersistent,
      dataCy: 'persistent',
    },
    {
      name: T.Size,
      value: prettyBytes(SIZE, 'MB'),
      dataCy: 'size',
    },
    {
      name: T.State,
      value: <StatusChip text={stateName} stateColor={stateColor} />,
      dataCy: 'state',
    },
    {
      name: T.RunningVMs,
      value: `${[VMS?.ID ?? []].flat().length || 0}`,
    },
  ]

  return (
    <>
      <List
        title={T.Information}
        list={info}
        containerProps={{ sx: { gridRow: 'span 3' } }}
      />
    </>
  )
}

InformationPanel.propTypes = {
  image: PropTypes.object,
  actions: PropTypes.arrayOf(PropTypes.string),
}

InformationPanel.displayName = 'InformationPanel'

export default InformationPanel
