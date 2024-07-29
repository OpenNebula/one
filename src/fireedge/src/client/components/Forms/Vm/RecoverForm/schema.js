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
import { string, object } from 'yup'
import { getValidationFromFields } from 'client/utils'
import { T, INPUT_TYPES } from 'client/constants'

const OPERATION = {
  name: 'operation',
  label: T.Operation,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  dependOf: 'operation', // itself is a dependency
  tooltip: (operation) =>
    ({
      0: T.OperationConceptFailure,
      1: T.OperationConceptSuccess,
      2: T.OperationConceptRetry,
      3: T.OperationConceptDelete,
      4: T.OperationConceptRecreate,
      5: T.OperationConceptDeleteDb,
    }[operation]),
  values: [
    { text: T.Failure, value: 0 },
    { text: T.Success, value: 1 },
    { text: T.Retry, value: 2 },
    { text: T.Delete, value: 3 },
    { text: T.Recreate, value: 4 },
    { text: T.DeleteDb, value: 5 },
  ],
  validation: string()
    .trim()
    .required()
    .default(() => 2),
}

export const FIELDS = [OPERATION]

export const SCHEMA = object(getValidationFromFields(FIELDS))
