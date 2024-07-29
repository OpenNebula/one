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

import { List } from 'client/components/Tabs/Common'
import { useRenameTemplateMutation } from 'client/features/OneApi/vmTemplate'
import { isRestrictedAttributes } from 'client/utils'
import Image from 'client/components/Image'
import { timeToString, levelLockToString } from 'client/models/Helper'
import {
  T,
  VM_TEMPLATE_ACTIONS,
  STATIC_FILES_URL,
  VmTemplate,
  RESTRICTED_ATTRIBUTES_TYPE,
} from 'client/constants'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {VmTemplate} props.template - Template
 * @param {string[]} props.actions - Available actions to information tab
 * @param {object} props.oneConfig - Open Nebula configuration
 * @param {boolean} props.adminGroup - If the user belongs to oneadmin group
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({
  template = {},
  actions,
  oneConfig,
  adminGroup,
}) => {
  const [renameTemplate] = useRenameTemplateMutation()

  const { ID, NAME, REGTIME, LOCK, TEMPLATE = {} } = template
  const { LOGO } = TEMPLATE

  const handleRename = async (_, newName) => {
    await renameTemplate({ id: ID, name: newName })
  }

  const info = [
    { name: T.ID, value: ID, dataCy: 'id' },
    {
      name: T.Name,
      value: NAME,
      canEdit:
        actions?.includes?.(VM_TEMPLATE_ACTIONS.RENAME) &&
        (adminGroup ||
          !isRestrictedAttributes(
            'NAME',
            undefined,
            oneConfig[RESTRICTED_ATTRIBUTES_TYPE.VM]
          )),
      handleEdit: handleRename,
      dataCy: 'name',
    },
    {
      name: T.StartTime,
      value: timeToString(REGTIME),
      dataCy: 'starttime',
    },
    {
      name: T.Locked,
      value: levelLockToString(LOCK?.LOCKED),
      dataCy: 'locked',
    },
    LOGO && {
      name: T.Logo,
      value: <Image alt="logo" src={`${STATIC_FILES_URL}/${LOGO}`} />,
      dataCy: 'logo',
    },
  ].filter(Boolean)

  return (
    <List
      title={T.Information}
      list={info}
      containerProps={{ sx: { gridRow: 'span 3' } }}
    />
  )
}

InformationPanel.displayName = 'InformationPanel'

InformationPanel.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  template: PropTypes.object,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

export default InformationPanel
