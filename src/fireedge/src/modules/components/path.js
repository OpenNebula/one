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

import { RESOURCE_NAMES, SOCKETS } from '@ConstantsModule'

export const PATH = {
  INSTANCE: {
    VMS: {
      LIST: `/${RESOURCE_NAMES.VM}`,
      DETAIL: `/${RESOURCE_NAMES.VM}/:id`,
    },
    VROUTERS: {
      LIST: `/${RESOURCE_NAMES.VROUTER}`,
      INSTANTIATE: `/${RESOURCE_NAMES.VROUTER}/instantiate`,
      DETAIL: `/${RESOURCE_NAMES.VROUTER}/:id`,
    },
    SERVICES: {
      LIST: `/${RESOURCE_NAMES.SERVICE}`,
      DETAIL: `/${RESOURCE_NAMES.SERVICE}/:id`,
      INSTANTIATE: `/${RESOURCE_NAMES.SERVICE}/instantiate/`,
    },
  },
  TEMPLATE: {
    VMS: {
      LIST: `/${RESOURCE_NAMES.VM_TEMPLATE}`,
      INSTANTIATE: `/${RESOURCE_NAMES.VM_TEMPLATE}/instantiate`,
      CREATE: `/${RESOURCE_NAMES.VM_TEMPLATE}/create`,
      UPDATE: `/${RESOURCE_NAMES.VM_TEMPLATE}/update`,
      DETAIL: `/${RESOURCE_NAMES.VM_TEMPLATE}/:id`,
    },
    VMGROUP: {
      LIST: `/${RESOURCE_NAMES.VM_GROUP}`,
      INSTANTIATE: `/${RESOURCE_NAMES.VM_GROUP}/instantiate`,
      CREATE: `/${RESOURCE_NAMES.VM_GROUP}/create`,
      DETAIL: `/${RESOURCE_NAMES.VM_GROUP}/:id`,
    },
    VROUTERS: {
      LIST: `/${RESOURCE_NAMES.VROUTER_TEMPLATE}`,
      DETAIL: `/${RESOURCE_NAMES.VROUTER_TEMPLATE}/:id`,
      INSTANTIATE: `/${RESOURCE_NAMES.VROUTER_TEMPLATE}/instantiate/`,
      CREATE: `/${RESOURCE_NAMES.VROUTER_TEMPLATE}/create`,
    },
    SERVICES: {
      LIST: `/${RESOURCE_NAMES.SERVICE_TEMPLATE}`,
      DETAIL: `/${RESOURCE_NAMES.SERVICE_TEMPLATE}/:id`,
      INSTANTIATE: `/${RESOURCE_NAMES.SERVICE_TEMPLATE}/instantiate/`,
      CREATE: `/${RESOURCE_NAMES.SERVICE_TEMPLATE}/create`,
    },
  },
  STORAGE: {
    DATASTORES: {
      LIST: `/${RESOURCE_NAMES.DATASTORE}`,
      DETAIL: `/${RESOURCE_NAMES.DATASTORE}/:id`,
      CREATE: `/${RESOURCE_NAMES.DATASTORE}/create`,
    },
    IMAGES: {
      LIST: `/${RESOURCE_NAMES.IMAGE}`,
      DETAIL: `/${RESOURCE_NAMES.IMAGE}/:id`,
      CREATE: `/${RESOURCE_NAMES.IMAGE}/create`,
    },
    FILES: {
      LIST: `/${RESOURCE_NAMES.FILE}`,
      DETAIL: `/${RESOURCE_NAMES.FILE}/:id`,
      CREATE: `/${RESOURCE_NAMES.FILE}/create`,
    },
    BACKUPS: {
      LIST: `/${RESOURCE_NAMES.BACKUP}`,
      DETAIL: `/${RESOURCE_NAMES.BACKUP}/:id`,
    },
    MARKETPLACES: {
      LIST: `/${RESOURCE_NAMES.MARKETPLACE}`,
      DETAIL: `/${RESOURCE_NAMES.MARKETPLACE}/:id`,
      CREATE: `/${RESOURCE_NAMES.MARKETPLACE}/create`,
    },
    MARKETPLACE_APPS: {
      LIST: `/${RESOURCE_NAMES.APP}`,
      DETAIL: `/${RESOURCE_NAMES.APP}/:id`,
      CREATE: `/${RESOURCE_NAMES.APP}/create`,
    },
    BACKUPJOBS: {
      LIST: `/${RESOURCE_NAMES.BACKUPJOBS}`,
      DETAIL: `/${RESOURCE_NAMES.BACKUPJOBS}/:id`,
      CREATE: `/${RESOURCE_NAMES.BACKUPJOBS}/create`,
    },
  },
  NETWORK: {
    VNETS: {
      LIST: `/${RESOURCE_NAMES.VNET}`,
      DETAIL: `/${RESOURCE_NAMES.VNET}/:id`,
      CREATE: `/${RESOURCE_NAMES.VNET}/create`,
      UPDATE: `/${RESOURCE_NAMES.VNET}/update`,
    },
    VN_TEMPLATES: {
      LIST: `/${RESOURCE_NAMES.VN_TEMPLATE}`,
      INSTANTIATE: `/${RESOURCE_NAMES.VN_TEMPLATE}/instantiate`,
      DETAIL: `/${RESOURCE_NAMES.VN_TEMPLATE}/:id`,
      CREATE: `/${RESOURCE_NAMES.VN_TEMPLATE}/create`,
      UPDATE: `/${RESOURCE_NAMES.VN_TEMPLATE}/update`,
    },
    SEC_GROUPS: {
      LIST: `/${RESOURCE_NAMES.SEC_GROUP}`,
      DETAIL: `/${RESOURCE_NAMES.SEC_GROUP}/:id`,
      CREATE: `/${RESOURCE_NAMES.SEC_GROUP}/create`,
    },
  },
  INFRASTRUCTURE: {
    PROVIDERS: {
      LIST: '/providers',
      CREATE: '/providers/create',
      EDIT: '/providers/edit/:id',
    },
    PROVISIONS: {
      LIST: '/provisions',
      CREATE: '/provisions/create',
      EDIT: '/provisions/edit/:id',
    },
    CLUSTERS: {
      LIST: `/${RESOURCE_NAMES.CLUSTER}`,
      DETAIL: `/${RESOURCE_NAMES.CLUSTER}/:id`,
      CREATE: `/${RESOURCE_NAMES.CLUSTER}/create`,
    },
    HOSTS: {
      LIST: `/${RESOURCE_NAMES.HOST}`,
      DETAIL: `/${RESOURCE_NAMES.HOST}/:id`,
      CREATE: `/${RESOURCE_NAMES.HOST}/create`,
    },
    ZONES: {
      LIST: `/${RESOURCE_NAMES.ZONE}`,
      DETAIL: `/${RESOURCE_NAMES.ZONE}/:id`,
    },
  },
  SYSTEM: {
    USERS: {
      LIST: `/${RESOURCE_NAMES.USER}`,
      DETAIL: `/${RESOURCE_NAMES.USER}/:id`,
      CREATE: `/${RESOURCE_NAMES.USER}/create`,
    },
    GROUPS: {
      LIST: `/${RESOURCE_NAMES.GROUP}`,
      DETAIL: `/${RESOURCE_NAMES.GROUP}/:id`,
      CREATE: `/${RESOURCE_NAMES.GROUP}/create`,
    },
    VDCS: {
      LIST: `/${RESOURCE_NAMES.VDC}`,
      DETAIL: `/${RESOURCE_NAMES.VDC}/:id`,
      CREATE: `/${RESOURCE_NAMES.VDC}/create`,
    },
    ACLS: {
      LIST: `/${RESOURCE_NAMES.ACL}`,
      CREATE: `/${RESOURCE_NAMES.ACL}/create`,
    },
  },
  SUPPORT: `/${RESOURCE_NAMES.SUPPORT}`,
  GUACAMOLE: `/${SOCKETS.GUACAMOLE}/:id/:type`,
}

export default { PATH }
