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
import { createAsyncForm, CreateFormCallback } from '@UtilsModule'
import { ReactElement } from 'react'

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const UpdatePlanConfigurationForm = createAsyncForm(() =>
  import('@modules/resources/Cluster/Forms/UpdatePlanConfigurationForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const ChangeClusterForm = createAsyncForm(() =>
  import('@modules/resources/Cluster/Forms/ChangeClusterForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateForm = createAsyncForm(() =>
  import('@modules/resources/Cluster/Forms/CreateForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateCloudForm = createAsyncForm(() =>
  import('@modules/resources/Cluster/Forms/CreateCloudForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const AddHostForm = createAsyncForm(() =>
  import('@modules/resources/Cluster/Forms/AddHostForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const AddVnetsForm = createAsyncForm(() =>
  import('@modules/resources/Cluster/Forms/AddVnetsForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const DeleteVnetsForm = createAsyncForm(() =>
  import('@modules/resources/Cluster/Forms/DeleteVnetsForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const DeleteIpsForm = createAsyncForm(() =>
  import('@modules/resources/Cluster/Forms/DeleteIpsForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const DeleteHostForm = createAsyncForm(() =>
  import('@modules/resources/Cluster/Forms/DeleteHostForm')
)

export {
  AddHostForm,
  AddVnetsForm,
  ChangeClusterForm,
  CreateCloudForm,
  CreateForm,
  DeleteHostForm,
  DeleteIpsForm,
  DeleteVnetsForm,
  UpdatePlanConfigurationForm,
}
