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
import { array, object, string } from 'yup'

export const STEP_ID = 'secondaryGroups'
export const FIELD_NAME = 'groups'

const groupModel = {
  ...groupTable,
  columns: () => groupTable.columns(GROUP_LIST_COLUMNS),
}

/** @type {Field} Secondary groups selection field */
const SECONDARY_GROUPS = {
  name: FIELD_NAME,
  label: T.SecondaryGroups,
  type: INPUT_TYPES.TABLE,
  model: groupModel,
  selectOnRowClick: true,
  fieldProps: {
    preserveState: true,
    isEnableSearchBar: true,
    isCopyColumn: true,
    size: 'medium',
  },
  singleSelect: false,
  validation: array(string().trim()).default(() => []),
  grid: { md: 12 },
}

const FIELDS = [SECONDARY_GROUPS]

const SCHEMA = object(getValidationFromFields(FIELDS))

const Content = () => (
  <FormWithSchema id={STEP_ID} cy={`${STEP_ID}`} fields={FIELDS} />
)

/**
 * User secondary groups configuration.
 *
 * @returns {object} Secondary groups configuration step
 */
const SecondaryGroupsStep = () => ({
  id: STEP_ID,
  label: T.SecondaryGroups,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
}

export default SecondaryGroupsStep
