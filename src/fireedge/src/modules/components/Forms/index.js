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
import { buildMethods } from '@UtilsModule'
import ButtonToTriggerForm, {
  ButtonToTriggerFormPropTypes,
} from '@modules/components/Forms/ButtonToTriggerForm'

import * as ACLs from '@modules/components/Forms/ACLs'
import * as Backup from '@modules/components/Forms/Backup'
import * as BackupJob from '@modules/components/Forms/BackupJob'
import * as Cluster from '@modules/components/Forms/Cluster'
import * as Datastore from '@modules/components/Forms/Datastore'
import * as File from '@modules/components/Forms/File'
import * as Group from '@modules/components/Forms/Group'
import * as Host from '@modules/components/Forms/Host'
import * as Image from '@modules/components/Forms/Image'
import * as Marketplace from '@modules/components/Forms/Marketplace'
import * as MarketplaceApp from '@modules/components/Forms/MarketplaceApp'
import * as Provider from '@modules/components/Forms/Provider'
import * as Provision from '@modules/components/Forms/Provision'
import * as SecurityGroup from '@modules/components/Forms/SecurityGroups'
import * as Service from '@modules/components/Forms/Service'
import * as ServiceTemplate from '@modules/components/Forms/ServiceTemplate'
import * as Settings from '@modules/components/Forms/Settings'
import * as Support from '@modules/components/Forms/Support'
import * as User from '@modules/components/Forms/User'
import * as VnTemplate from '@modules/components/Forms/VnTemplate'
import * as Vn from '@modules/components/Forms/VNetwork'
import * as VrTemplate from '@modules/components/Forms/VrTemplate'
import * as Vdc from '@modules/components/Forms/Vdc'
import * as Vm from '@modules/components/Forms/Vm'
import * as VmGroup from '@modules/components/Forms/VmGroup'
import * as VmTemplate from '@modules/components/Forms/VmTemplate'
import Legend from '@modules/components/Forms/Legend'
import FormWithSchema from '@modules/components/Forms/FormWithSchema'
buildMethods()

export {
  ButtonToTriggerForm,
  ButtonToTriggerFormPropTypes,
  Legend,
  FormWithSchema,
}

export const Form = {
  ACLs,
  Backup,
  BackupJob,
  Cluster,
  Datastore,
  File,
  Group,
  Host,
  Image,
  Marketplace,
  MarketplaceApp,
  Provider,
  Provision,
  SecurityGroup,
  Service,
  ServiceTemplate,
  Settings,
  Support,
  User,
  VnTemplate,
  Vn,
  VrTemplate,
  Vdc,
  Vm,
  VmGroup,
  VmTemplate,
}
