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
import { ReactElement } from 'react'
import { AsyncLoadForm, ConfigurationProps } from 'client/components/HOC'
import { CreateStepsCallback, CreateFormCallback } from 'client/utils/schema'

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const AddRangeForm = (configProps) =>
  AsyncLoadForm({ formPath: 'VNetwork/AddRangeForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const CreateForm = (configProps) =>
  AsyncLoadForm({ formPath: 'VNetwork/CreateForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const ReserveForm = (configProps) =>
  AsyncLoadForm({ formPath: 'VNetwork/ReserveForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const RecoverForm = (configProps) =>
  AsyncLoadForm({ formPath: 'VNetwork/RecoverForm' }, configProps)

export { AddRangeForm, CreateForm, ReserveForm, RecoverForm }
