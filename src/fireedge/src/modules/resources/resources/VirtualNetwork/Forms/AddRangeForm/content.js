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
import { ReactElement, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useFormContext, useWatch } from 'react-hook-form'
import { Box } from '@mui/material'
import { unset } from 'lodash'

import { AttributesPanel, FormWithSchema } from '@ComponentsV2Module'
import {
  FIELDS,
  MUTABLE_FIELDS,
} from '@modules/resources/resources/VirtualNetwork/Forms/AddRangeForm/schema'
import { cleanEmpty, cloneObject, set } from '@UtilsModule'
import { T } from '@ConstantsModule'

export const CUSTOM_ATTRS_ID = 'custom-attributes'

const AR_TYPES = {
  IP4: 'IP4',
  IP4_6: 'IP4_6',
  IP6: 'IP6',
  IP6_STATIC: 'IP6_STATIC',
  ETHER: 'ETHER',
}

const FIELD_ORDER_BY_TYPE = {
  [AR_TYPES.IP4]: [
    'TYPE',
    'IP',
    'SIZE',
    'SHARED',
    'MAC',
    'IP6',
    'GLOBAL_PREFIX',
    'PREFIX_LENGTH',
    'ULA_PREFIX',
  ],
  [AR_TYPES.IP4_6]: [
    'TYPE',
    'IP',
    'IP6',
    'SIZE',
    'SHARED',
    'MAC',
    'GLOBAL_PREFIX',
    'ULA_PREFIX',
    'PREFIX_LENGTH',
  ],
  [AR_TYPES.IP6]: [
    'TYPE',
    'GLOBAL_PREFIX',
    'ULA_PREFIX',
    'SIZE',
    'SHARED',
    'MAC',
    'IP',
    'IP6',
    'PREFIX_LENGTH',
  ],
  [AR_TYPES.IP6_STATIC]: [
    'TYPE',
    'IP6',
    'PREFIX_LENGTH',
    'SIZE',
    'SHARED',
    'MAC',
    'GLOBAL_PREFIX',
    'ULA_PREFIX',
    'IP',
  ],
  [AR_TYPES.ETHER]: [
    'TYPE',
    'SIZE',
    'SHARED',
    'MAC',
    'IP',
    'IP6',
    'GLOBAL_PREFIX',
    'PREFIX_LENGTH',
    'ULA_PREFIX',
  ],
}

const orderFieldsByType = (fields = [], type = AR_TYPES.IP4) => {
  const fieldByName = new Map(fields.map((field) => [field.name, field]))
  const orderedNames = FIELD_ORDER_BY_TYPE[type] ?? FIELD_ORDER_BY_TYPE.IP4
  const orderedNameSet = new Set(orderedNames)

  return [
    ...orderedNames.map((name) => fieldByName.get(name)).filter(Boolean),
    ...fields.filter((field) => !orderedNameSet.has(field.name)),
  ]
}

const getReadOnlyField = (field = {}) => ({
  ...field,
  readOnly: true,
  fieldProps: {
    ...field.fieldProps,
    disabled: true,
    isDisabled: true,
  },
})

const isDisabledField = (field = {}) =>
  field.readOnly || field.fieldProps?.disabled || field.fieldProps?.isDisabled

const getUpdateFields = (fields = [], mutableFields = []) => {
  const mutableFieldByName = new Map(
    mutableFields.map((field) => [field.name, field])
  )

  return fields.map((field) => {
    const mutableField = mutableFieldByName.get(field.name)

    if (!mutableField) return getReadOnlyField(field)

    return isDisabledField(mutableField)
      ? getReadOnlyField(mutableField)
      : mutableField
  })
}

/**
 * @param {object} props - Props
 * @param {boolean} [props.isUpdate] - Is `true` the form will be filter immutable attributes
 * @param {object} props.oneConfig - Open Nebula configuration
 * @param {boolean} props.adminGroup - If the user belongs to oneadmin group
 * @returns {ReactElement} Form content component
 */
const Content = ({ isUpdate, oneConfig, adminGroup }) => {
  const { setValue } = useFormContext()
  const customAttrs = useWatch({ name: CUSTOM_ATTRS_ID }) || {}
  const addressRangeType = useWatch({ name: 'TYPE' })

  const fields = useMemo(() => {
    const allFields = FIELDS(oneConfig, adminGroup)
    const formFields = isUpdate
      ? getUpdateFields(allFields, MUTABLE_FIELDS())
      : allFields

    return orderFieldsByType(formFields, addressRangeType ?? AR_TYPES.IP4)
  }, [addressRangeType, adminGroup, isUpdate, oneConfig])

  const handleChangeAttribute = useCallback(
    ({ key, path, value } = {}) => {
      const attributePath = path ?? key
      if (!attributePath) return

      const newCustomAttrs = cloneObject(customAttrs)
      set(newCustomAttrs, attributePath, value)
      setValue(CUSTOM_ATTRS_ID, cleanEmpty(newCustomAttrs))
    },
    [customAttrs, setValue]
  )

  const handleDeleteAttribute = useCallback(
    (index, attribute) => {
      const attributePath =
        attribute?.path ?? attribute?.key ?? Object.keys(customAttrs)?.[index]

      if (!attributePath) return

      const newCustomAttrs = cloneObject(customAttrs)
      unset(newCustomAttrs, attributePath)
      setValue(CUSTOM_ATTRS_ID, cleanEmpty(newCustomAttrs))
    },
    [customAttrs, setValue]
  )

  return (
    <Box display="grid" gap="1em">
      <FormWithSchema fields={fields} />
      <AttributesPanel
        title={T.CustomInformation}
        actions={{ add: true, edit: true, delete: true, copy: true }}
        handleAdd={handleChangeAttribute}
        handleEdit={handleChangeAttribute}
        handleDelete={handleDeleteAttribute}
        attributes={customAttrs}
        isFullHeight={false}
      />
    </Box>
  )
}

Content.propTypes = {
  isUpdate: PropTypes.bool,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

export default Content
