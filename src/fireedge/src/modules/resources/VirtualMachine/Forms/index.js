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
import { getChangeGroupForm, getChangeUserForm } from '@ComponentsV2Module'

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const ImageSteps = createAsyncForm(() =>
  import('@modules/resources/VirtualMachine/Forms/AttachDiskForm/ImageSteps')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const VolatileSteps = createAsyncForm(() =>
  import('@modules/resources/VirtualMachine/Forms/AttachDiskForm/VolatileSteps')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const AttachNicForm = createAsyncForm(() =>
  import('@modules/resources/VirtualMachine/Forms/AttachNicForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const UpdateNicForm = createAsyncForm(() =>
  import('@modules/resources/VirtualMachine/Forms/UpdateNicForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const AttachSecGroupForm = createAsyncForm(() =>
  import('@modules/resources/VirtualMachine/Forms/AttachSecGroupForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const AliasForm = createAsyncForm(() =>
  import('@modules/resources/VirtualMachine/Forms/AliasForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const AttachAliasForm = createAsyncForm(() =>
  import('@modules/resources/VirtualMachine/Forms/AttachAliasForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const ChangeUserForm = getChangeUserForm

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const ChangeGroupForm = getChangeGroupForm

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateDiskSnapshotForm = createAsyncForm(() =>
  import('@modules/resources/VirtualMachine/Forms/CreateDiskSnapshotForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateSnapshotForm = createAsyncForm(() =>
  import('@modules/resources/VirtualMachine/Forms/CreateSnapshotForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const MigrateForm = createAsyncForm(() =>
  import('@modules/resources/VirtualMachine/Forms/MigrateForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const RecoverForm = createAsyncForm(() =>
  import('@modules/resources/VirtualMachine/Forms/RecoverForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const ResizeCapacityForm = createAsyncForm(() =>
  import('@modules/resources/VirtualMachine/Forms/ResizeCapacityForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const ResizeDiskForm = createAsyncForm(() =>
  import('@modules/resources/VirtualMachine/Forms/ResizeDiskForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const SaveAsDiskForm = createAsyncForm(() =>
  import('@modules/resources/VirtualMachine/Forms/SaveAsDiskForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const SaveAsTemplateForm = createAsyncForm(() =>
  import('@modules/resources/VirtualMachine/Forms/SaveAsTemplateForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateSchedActionForm = createAsyncForm(() =>
  import('@modules/resources/VirtualMachine/Forms/CreateSchedActionForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateRelativeSchedActionForm = createAsyncForm(
  () => import('@modules/resources/VirtualMachine/Forms/CreateSchedActionForm'),
  'RelativeForm'
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateBackupJobSchedActionForm = createAsyncForm(
  () => import('@modules/resources/VirtualMachine/Forms/CreateSchedActionForm'),
  'BackupJobForm'
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateCharterForm = createAsyncForm(() =>
  import('@modules/resources/VirtualMachine/Forms/CreateCharterForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const CreateRelativeCharterForm = createAsyncForm(
  () => import('@modules/resources/VirtualMachine/Forms/CreateCharterForm'),
  'RelativeForm'
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const UpdateConfigurationForm = createAsyncForm(() =>
  import('@modules/resources/VirtualMachine/Forms/UpdateConfigurationForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const BackupForm = createAsyncForm(() =>
  import('@modules/resources/VirtualMachine/Forms/BackupForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Restore backup form
 */
const BackupRestoreForm = createAsyncForm(() =>
  import('@modules/resources/Backups/Forms/RestoreForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const BackupConfigForm = createAsyncForm(() =>
  import('@modules/resources/VirtualMachine/Forms/BackupConfigForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateFormCallback} Asynchronous loaded form
 */
const AttachPciForm = createAsyncForm(() =>
  import('@modules/resources/VirtualMachine/Forms/AttachPciForm')
)

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
