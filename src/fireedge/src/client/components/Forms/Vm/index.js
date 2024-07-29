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
import { AsyncLoadForm, ConfigurationProps } from 'client/components/HOC'
import { CreateFormCallback, CreateStepsCallback } from 'client/utils/schema'
import { ReactElement } from 'react'

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const ImageSteps = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/AttachDiskForm/ImageSteps' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const VolatileSteps = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/AttachDiskForm/VolatileSteps' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const AttachNicForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/AttachNicForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const UpdateNicForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/UpdateNicForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const AttachSecGroupForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/AttachSecGroupForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const AliasForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/AliasForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const AttachAliasForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/AttachAliasForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const ChangeUserForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/ChangeUserForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const ChangeGroupForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/ChangeGroupForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateDiskSnapshotForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/CreateDiskSnapshotForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateSnapshotForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/CreateSnapshotForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const MigrateForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/MigrateForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const RecoverForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/RecoverForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const ResizeCapacityForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/ResizeCapacityForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const ResizeDiskForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/ResizeDiskForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const SaveAsDiskForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/SaveAsDiskForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const SaveAsTemplateForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/SaveAsTemplateForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateSchedActionForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/CreateSchedActionForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateRelativeSchedActionForm = (configProps) =>
  AsyncLoadForm(
    { formPath: 'Vm/CreateSchedActionForm', componentToLoad: 'RelativeForm' },
    configProps
  )

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateBackupJobSchedActionForm = (configProps) =>
  AsyncLoadForm(
    { formPath: 'Vm/CreateSchedActionForm', componentToLoad: 'BackupJobForm' },
    configProps
  )

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateCharterForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/CreateCharterForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateRelativeCharterForm = (configProps) =>
  AsyncLoadForm(
    { formPath: 'Vm/CreateCharterForm', componentToLoad: 'RelativeForm' },
    configProps
  )

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const UpdateConfigurationForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/UpdateConfigurationForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const BackupForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/BackupForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const AttachPciForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Vm/AttachPciForm' }, configProps)

export {
  AttachNicForm,
  AttachPciForm,
  AttachSecGroupForm,
  BackupForm,
  ChangeGroupForm,
  ChangeUserForm,
  CreateBackupJobSchedActionForm,
  CreateCharterForm,
  CreateDiskSnapshotForm,
  CreateRelativeCharterForm,
  CreateRelativeSchedActionForm,
  CreateSchedActionForm,
  CreateSnapshotForm,
  ImageSteps,
  MigrateForm,
  RecoverForm,
  ResizeCapacityForm,
  ResizeDiskForm,
  SaveAsDiskForm,
  SaveAsTemplateForm,
  UpdateConfigurationForm,
  UpdateNicForm,
  VolatileSteps,
  AliasForm,
  AttachAliasForm,
}
