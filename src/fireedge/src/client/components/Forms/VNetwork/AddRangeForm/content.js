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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { useFormContext, useWatch } from 'react-hook-form'
import { Box } from '@mui/material'

import { FormWithSchema } from 'client/components/Forms'
import { AttributePanel } from 'client/components/Tabs/Common'
import {
  FIELDS,
  MUTABLE_FIELDS,
} from 'client/components/Forms/VNetwork/AddRangeForm/schema'
import { cleanEmpty, cloneObject, set } from 'client/utils'
import { T } from 'client/constants'

export const CUSTOM_ATTRS_ID = 'custom-attributes'

/**
 * @param {object} props - Props
 * @param {boolean} [props.isUpdate] - Is `true` the form will be filter immutable attributes
 * @returns {ReactElement} Form content component
 */
const Content = ({ isUpdate }) => {
  const { setValue } = useFormContext()
  const customAttrs = useWatch({ name: CUSTOM_ATTRS_ID }) || {}

  const handleChangeAttribute = (path, newValue) => {
    const newCustomAttrs = cloneObject(customAttrs)

    set(newCustomAttrs, path, newValue)
    setValue(CUSTOM_ATTRS_ID, cleanEmpty(newCustomAttrs))
  }

  return (
    <Box display="grid" gap="1em">
      <FormWithSchema fields={isUpdate ? MUTABLE_FIELDS : FIELDS} />
      <AttributePanel
        collapse
        askToDelete={false}
        allActionsEnabled
        title={T.CustomInformation}
        handleAdd={handleChangeAttribute}
        handleEdit={handleChangeAttribute}
        handleDelete={handleChangeAttribute}
        attributes={customAttrs}
        filtersSpecialAttributes={false}
      />
    </Box>
  )
}

Content.propTypes = { isUpdate: PropTypes.bool }

export default Content
