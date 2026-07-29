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
import { AsyncLoadForm, ConfigurationProps } from '@modules/resources/HOC'
import { CreateFormCallback, CreateStepsCallback } from '@UtilsModule'
import { ReactElement } from 'react'
import { getChangeGroupForm, getChangeUserForm } from '@ComponentsV2Module'

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const ImageSteps = (configProps) =>
  AsyncLoadForm(
    { formPath: 'VirtualMachine/Forms/AttachDiskForm/ImageSteps' },
    configProps
  )

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const VolatileSteps = (configProps) =>
  AsyncLoadForm(
    { formPath: 'VirtualMachine/Forms/AttachDiskForm/VolatileSteps' },
    configProps
  )

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const AttachNicForm = (configProps) =>
  AsyncLoadForm({ formPath: 'VirtualMachine/Forms/AttachNicForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const UpdateNicForm = (configProps) =>
  AsyncLoadForm({ formPath: 'VirtualMachine/Forms/UpdateNicForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const AttachSecGroupForm = (configProps) =>
  AsyncLoadForm(
    { formPath: 'VirtualMachine/Forms/AttachSecGroupForm' },
    configProps
  )

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const AliasForm = (configProps) =>
  AsyncLoadForm({ formPath: 'VirtualMachine/Forms/AliasForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const AttachAliasForm = (configProps) =>
  AsyncLoadForm(
    { formPath: 'VirtualMachine/Forms/AttachAliasForm' },
    configProps
  )

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const ChangeUserForm = getChangeUserForm

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const ChangeGroupForm = getChangeGroupForm

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateDiskSnapshotForm = (configProps) =>
  AsyncLoadForm(
    { formPath: 'VirtualMachine/Forms/CreateDiskSnapshotForm' },
    configProps
  )

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateSnapshotForm = (configProps) =>
  AsyncLoadForm(
    { formPath: 'VirtualMachine/Forms/CreateSnapshotForm' },
    configProps
  )

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const MigrateForm = (configProps) =>
  AsyncLoadForm({ formPath: 'VirtualMachine/Forms/MigrateForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const RecoverForm = (configProps) =>
  AsyncLoadForm({ formPath: 'VirtualMachine/Forms/RecoverForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const ResizeCapacityForm = (configProps) =>
  AsyncLoadForm(
    { formPath: 'VirtualMachine/Forms/ResizeCapacityForm' },
    configProps
  )

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const ResizeDiskForm = (configProps) =>
  AsyncLoadForm(
    { formPath: 'VirtualMachine/Forms/ResizeDiskForm' },
    configProps
  )

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const SaveAsDiskForm = (configProps) =>
  AsyncLoadForm(
    { formPath: 'VirtualMachine/Forms/SaveAsDiskForm' },
    configProps
  )

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const SaveAsTemplateForm = (configProps) =>
  AsyncLoadForm(
    { formPath: 'VirtualMachine/Forms/SaveAsTemplateForm' },
    configProps
  )

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateSchedActionForm = (configProps) =>
  AsyncLoadForm(
    { formPath: 'VirtualMachine/Forms/CreateSchedActionForm' },
    configProps
  )

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateRelativeSchedActionForm = (configProps) =>
  AsyncLoadForm(
    {
      formPath: 'VirtualMachine/Forms/CreateSchedActionForm',
      componentToLoad: 'RelativeForm',
    },
    configProps
  )

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateBackupJobSchedActionForm = (configProps) =>
  AsyncLoadForm(
    {
      formPath: 'VirtualMachine/Forms/CreateSchedActionForm',
      componentToLoad: 'BackupJobForm',
    },
    configProps
  )

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateCharterForm = (configProps) =>
  AsyncLoadForm(
    { formPath: 'VirtualMachine/Forms/CreateCharterForm' },
    configProps
  )

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateRelativeCharterForm = (configProps) =>
  AsyncLoadForm(
    {
      formPath: 'VirtualMachine/Forms/CreateCharterForm',
      componentToLoad: 'RelativeForm',
    },
    configProps
  )

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const UpdateConfigurationForm = (configProps) =>
  AsyncLoadForm(
    { formPath: 'VirtualMachine/Forms/UpdateConfigurationForm' },
    configProps
  )

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const BackupForm = (configProps) =>
  AsyncLoadForm({ formPath: 'VirtualMachine/Forms/BackupForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Restore backup form
 */
const BackupRestoreForm = (configProps) =>
  AsyncLoadForm({ formPath: 'Backups/Forms/RestoreForm' }, configProps)

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const BackupConfigForm = (configProps) =>
  AsyncLoadForm(
    { formPath: 'VirtualMachine/Forms/BackupConfigForm' },
    configProps
  )

/**
 * @param {ConfigurationProps} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const AttachPciForm = (configProps) =>
  AsyncLoadForm({ formPath: 'VirtualMachine/Forms/AttachPciForm' }, configProps)

export {
  AliasForm,
  AttachAliasForm,
  AttachNicForm,
  AttachPciForm,
  AttachSecGroupForm,
  BackupConfigForm,
  BackupForm,
  BackupRestoreForm,
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
}
