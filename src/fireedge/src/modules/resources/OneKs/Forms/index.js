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
import {
  createAsyncForm,
  CreateFormCallback,
  CreateStepsCallback,
} from '@UtilsModule'
import { ReactElement } from 'react'

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const ScaleKsGroupForm = createAsyncForm(() =>
  import('@modules/resources/OneKs/Forms/ScaleKsGroupForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateOneKsClusterForm = createAsyncForm(() =>
  import('@modules/resources/OneKs/Forms/CreateOneKsClusterForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateOneKsNodeGroupForm = createAsyncForm(() =>
  import('@modules/resources/OneKs/Forms/CreateOneKsNodeGroupForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const EditOneKsNodeGroupForm = createAsyncForm(() =>
  import('@modules/resources/OneKs/Forms/EditOneKsNodeGroupForm')
)

export {
  ScaleKsGroupForm,
  CreateOneKsClusterForm,
  CreateOneKsNodeGroupForm,
  EditOneKsNodeGroupForm,
}

export { useDeleteKsClusterConfirmation } from './DeleteKsClusterForm'
export { useUpgradeKsClusterFormModal } from './UpgradeKsClusterForm'
