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
import PropTypes from 'prop-types'
import { FormWithSchema } from '@ComponentsV2Module'
import { INPUT_TYPES, T } from '@ConstantsModule'
import { GROUP_LIST_COLUMNS, groupTable } from '@ModelsModule'
import { Field, getValidationFromFields } from '@UtilsModule'
import { object, string } from 'yup'

export const STEP_ID = 'primaryGroup'
export const FIELD_NAME = 'group'

const groupModel = {
  ...groupTable,
  columns: () => groupTable.columns(GROUP_LIST_COLUMNS),
}

/** @type {Field} Primary group selection field */
const PRIMARY_GROUP = {
  name: FIELD_NAME,
  label: T.PrimaryGroup,
  type: INPUT_TYPES.TABLE,
  model: groupModel,
  selectOnRowClick: true,
  fieldProps: {
    preserveState: true,
    isEnableSearchBar: true,
    size: 'medium',
  },
  singleSelect: true,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12 },
}

const FIELDS = [PRIMARY_GROUP]

const SCHEMA = object(getValidationFromFields(FIELDS))

const Content = () => (
  <FormWithSchema id={STEP_ID} cy={`${STEP_ID}`} fields={FIELDS} />
)

/**
 * User primary group configuration.
 *
 * @returns {object} Primary group configuration step
 */
const PrimaryGroupStep = () => ({
  id: STEP_ID,
  label: T.PrimaryGroup,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
}

export default PrimaryGroupStep
