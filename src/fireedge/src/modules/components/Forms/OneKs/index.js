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
import { AsyncLoadForm, ConfigurationProps } from '@modules/components/HOC'
import { CreateFormCallback, CreateStepsCallback } from '@UtilsModule'
import { ReactElement } from 'react'

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const DeleteOneKsClusterForm = (configProps) =>
  AsyncLoadForm({ formPath: 'OneKs/DeleteOneKsClusterForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const ScalingOneksNodeGroupsForm = (configProps) =>
  AsyncLoadForm({ formPath: 'OneKs/ScalingOneksNodeGroupsForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateOneKsClusterForm = (configProps) =>
  AsyncLoadForm({ formPath: 'OneKs/CreateOneKsClusterForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateOneKsNodeGroupForm = (configProps) =>
  AsyncLoadForm({ formPath: 'OneKs/CreateOneKsNodeGroupForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const EditOneKsNodeGroupForm = (configProps) =>
  AsyncLoadForm({ formPath: 'OneKs/EditOneKsNodeGroupForm' }, configProps)

export {
  DeleteOneKsClusterForm,
  ScalingOneksNodeGroupsForm,
  CreateOneKsClusterForm,
  CreateOneKsNodeGroupForm,
  EditOneKsNodeGroupForm,
}
