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
import { AsyncLoadForm, ConfigurationProps } from '@modules/components/HOC'
import { CreateFormCallback } from '@UtilsModule'
import { ReactElement } from 'react'

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const UpdatePlanConfigurationForm = (configProps) =>
  AsyncLoadForm(
    { formPath: 'Cluster/UpdatePlanConfigurationForm' },
    configProps
  )

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const ChangeClusterForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Cluster/ChangeClusterForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Cluster/CreateForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateCloudForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Cluster/CreateCloudForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const AddHostForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Cluster/AddHostForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const AddVnetsForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Cluster/AddVnetsForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const DeleteVnetsForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Cluster/DeleteVnetsForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const DeleteHostForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Cluster/DeleteHostForm' }, configProps)

export {
  AddHostForm,
  AddVnetsForm,
  ChangeClusterForm,
  CreateCloudForm,
  CreateForm,
  DeleteHostForm,
  DeleteVnetsForm,
  UpdatePlanConfigurationForm,
}
