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
import PropTypes from 'prop-types'
import { NetworkAlt as PlacementIcon } from 'iconoir-react'
import { useEffect } from 'react'

import FormWithSchema from '@modules/components/Forms/FormWithSchema'

import {
  STEP_ID as EXTRA_ID,
  TabType,
} from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import {
  SECTIONS,
  FIELDS,
} from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/placement/schema'
import { T } from '@ConstantsModule'
import { useGeneralApi } from '@FeaturesModule'

import { useSelector } from 'react-redux'

const Placement = ({ oneConfig, adminGroup, isUpdate }) => {
  const { setFieldPath } = useGeneralApi()

  const modifiedFields = useSelector((state) => state.general.modifiedFields)

  useEffect(() => {
    setFieldPath(`extra.Placement`)
  }, [])

  return (
    <>
      {SECTIONS(oneConfig, adminGroup, isUpdate, modifiedFields).map(
        ({ id, ...section }) => (
          <FormWithSchema
            key={id}
            id={EXTRA_ID}
            cy={`${EXTRA_ID}-${id}`}
            saveState={true}
            {...section}
          />
        )
      )}
    </>
  )
}

Placement.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  isUpdate: PropTypes.bool,
}

Placement.displayName = 'Placement'

/** @type {TabType} */
const TAB = {
  id: 'placement',
  name: T.Placement,
  icon: PlacementIcon,
  Content: Placement,
  getError: (error) => FIELDS({}).some(({ name }) => error?.[name]),
}

export default TAB
