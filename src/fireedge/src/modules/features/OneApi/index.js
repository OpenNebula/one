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

import AclAPI from '@modules/features/OneApi/acl'
import AuthAPI from '@modules/features/OneApi/auth'
import BackupJobAPI from '@modules/features/OneApi/backupjobs'
import ClusterAPI from '@modules/features/OneApi/cluster'
import DatastoreAPI from '@modules/features/OneApi/datastore'
import DriverAPI from '@modules/features/OneApi/driver'
import GroupAPI from '@modules/features/OneApi/group'
import HostAPI from '@modules/features/OneApi/host'
import ImageAPI from '@modules/features/OneApi/image'
import LogoAPI from '@modules/features/OneApi/logo'
import MarketplaceAPI from '@modules/features/OneApi/marketplace'
import MarketplaceAppAPI from '@modules/features/OneApi/marketplaceApp'
import VnAPI from '@modules/features/OneApi/network'
import VnTemplateAPI from '@modules/features/OneApi/networkTemplate'
import { oneApi } from '@modules/features/OneApi/oneApi'
import {
  DOCUMENT,
  DOCUMENT_POOL,
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
} from '@modules/features/OneApi/resources'
import SecurityGroupAPI from '@modules/features/OneApi/securityGroup'
import ServiceAPI from '@modules/features/OneApi/service'
import ServiceTemplateAPI from '@modules/features/OneApi/serviceTemplate'
import * as SocketAPI from '@modules/features/OneApi/socket'
import SupportAPI from '@modules/features/OneApi/support'
import SystemAPI from '@modules/features/OneApi/system'
import TfaAPI from '@modules/features/OneApi/tfa'
import UserAPI from '@modules/features/OneApi/user'
import VdcAPI from '@modules/features/OneApi/vdc'
import VmAPI from '@modules/features/OneApi/vm'
import VmGroupAPI from '@modules/features/OneApi/vmGroup'
import VmTemplateAPI from '@modules/features/OneApi/vmTemplate'
import VrAPI from '@modules/features/OneApi/vrouter'
import VrTemplateAPI from '@modules/features/OneApi/vrouterTemplate'
import ZoneAPI from '@modules/features/OneApi/zone'

export {
  AclAPI,
  AuthAPI,
  BackupJobAPI,
  ClusterAPI,
  DatastoreAPI,
  DriverAPI,
  DOCUMENT,
  DOCUMENT_POOL,
  GroupAPI,
  HostAPI,
  ImageAPI,
  LogoAPI,
  MarketplaceAPI,
  MarketplaceAppAPI,
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
  oneApi,
  SecurityGroupAPI,
  ServiceAPI,
  ServiceTemplateAPI,
  SocketAPI,
  SupportAPI,
  SystemAPI,
  TfaAPI,
  UserAPI,
  VdcAPI,
  VmAPI,
  VmGroupAPI,
  VmTemplateAPI,
  VnAPI,
  VnTemplateAPI,
  VrAPI,
  VrTemplateAPI,
  ZoneAPI,
}
