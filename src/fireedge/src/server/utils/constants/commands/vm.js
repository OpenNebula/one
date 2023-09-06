/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
const {
  from: { resource, postBody, query },
  httpMethod: { GET, POST, PUT, DELETE },
} = require('../defaults')
const VM_ALLOCATE = 'vm.allocate'
const VM_DEPLOY = 'vm.deploy'
const VM_ACTION = 'vm.action'
const VM_MIGRATE = 'vm.migrate'
const VM_CHMOD = 'vm.chmod'
const VM_CHOWN = 'vm.chown'
const VM_RENAME = 'vm.rename'
const VM_SNAP_CREATE = 'vm.snapshotcreate'
const VM_SNAP_REVERT = 'vm.snapshotrevert'
const VM_SNAP_DELETE = 'vm.snapshotdelete'
const VM_RESIZE = 'vm.resize'
const VM_UPDATE = 'vm.update'
const VM_CONF_UPDATE = 'vm.updateconf'
const VM_RECOVER = 'vm.recover'
const VM_INFO = 'vm.info'
const VM_MONITORING = 'vm.monitoring'
const VM_LOCK = 'vm.lock'
const VM_UNLOCK = 'vm.unlock'
const VM_DISK_SAVEAS = 'vm.disksaveas'
const VM_DISK_SNAP_CREATE = 'vm.disksnapshotcreate'
const VM_DISK_SNAP_DELETE = 'vm.disksnapshotdelete'
const VM_DISK_SNAP_REVERT = 'vm.disksnapshotrevert'
const VM_DISK_SNAP_RENAME = 'vm.disksnapshotrename'
const VM_DISK_ATTACH = 'vm.attach'
const VM_DISK_DETACH = 'vm.detach'
const VM_DISK_RESIZE = 'vm.diskresize'
const VM_NIC_ATTACH = 'vm.attachnic'
const VM_NIC_DETACH = 'vm.detachnic'
const VM_NIC_UPDATE = 'vm.updatenic'
const VM_SEC_GROUP_ATTACH = 'vm.attachsg'
const VM_SEC_GROUP_DETACH = 'vm.detachsg'
const VM_SCHED_ADD = 'vm.schedadd'
const VM_SCHED_UPDATE = 'vm.schedupdate'
const VM_SCHED_DELETE = 'vm.scheddelete'
const VM_BACKUP = 'vm.backup'
const VM_POOL_INFO = 'vmpool.info'
const VM_POOL_INFO_EXTENDED = 'vmpool.infoextended'
const VM_POOL_MONITORING = 'vmpool.monitoring'
const VM_POOL_ACCOUNTING = 'vmpool.accounting'
const VM_POOL_SHOWBACK = 'vmpool.showback'
const VM_POOL_CALCULATE_SHOWBACK = 'vmpool.calculateshowback'
const Actions = {
  VM_ALLOCATE,
  VM_DEPLOY,
  VM_ACTION,
  VM_MIGRATE,
  VM_CHMOD,
  VM_CHOWN,
  VM_RENAME,
  VM_SNAP_CREATE,
  VM_SNAP_REVERT,
  VM_SNAP_DELETE,
  VM_RESIZE,
  VM_UPDATE,
  VM_CONF_UPDATE,
  VM_RECOVER,
  VM_INFO,
  VM_MONITORING,
  VM_LOCK,
  VM_UNLOCK,
  VM_DISK_SAVEAS,
  VM_DISK_SNAP_CREATE,
  VM_DISK_SNAP_DELETE,
  VM_DISK_SNAP_REVERT,
  VM_DISK_SNAP_RENAME,
  VM_DISK_ATTACH,
  VM_DISK_DETACH,
  VM_DISK_RESIZE,
  VM_NIC_ATTACH,
  VM_NIC_DETACH,
  VM_NIC_UPDATE,
  VM_SEC_GROUP_ATTACH,
  VM_SEC_GROUP_DETACH,
  VM_SCHED_ADD,
  VM_SCHED_UPDATE,
  VM_SCHED_DELETE,
  VM_BACKUP,
  VM_POOL_INFO,
  VM_POOL_INFO_EXTENDED,
  VM_POOL_MONITORING,
  VM_POOL_ACCOUNTING,
  VM_POOL_SHOWBACK,
  VM_POOL_CALCULATE_SHOWBACK,
}
module.exports = {
  Actions,
  Commands: {
    [VM_ALLOCATE]: {
      // inspected
      httpMethod: PUT,
      params: {
        template: {
          from: postBody,
          default: '',
        },
        status: {
          from: postBody,
          default: false,
        },
      },
    },
    [VM_DEPLOY]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        host: {
          from: postBody,
          default: -1,
        },
        enforce: {
          from: postBody,
          default: false,
        },
        datastore: {
          from: postBody,
          default: -1,
        },
      },
    },
    [VM_ACTION]: {
      // inspected
      httpMethod: PUT,
      params: {
        action: {
          from: postBody,
          default: 'stop',
        },
        id: {
          from: resource,
          default: 0,
        },
      },
    },
    [VM_MIGRATE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        host: {
          from: postBody,
          default: -1,
        },
        live: {
          from: postBody,
          default: false,
        },
        enforce: {
          from: postBody,
          default: false,
        },
        datastore: {
          from: postBody,
          default: -1,
        },
        type: {
          from: postBody,
          default: 0,
        },
      },
    },
    [VM_DISK_SAVEAS]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        disk: {
          from: postBody,
          default: 0,
        },
        name: {
          from: postBody,
          default: '',
        },
        type: {
          from: postBody,
          default: '',
        },
        snapshot: {
          from: postBody,
          default: -1,
        },
      },
    },
    [VM_DISK_SNAP_CREATE]: {
      // inspected
      httpMethod: POST,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        disk: {
          from: postBody,
          default: 0,
        },
        name: {
          from: postBody,
          default: '',
        },
      },
    },
    [VM_DISK_SNAP_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        disk: {
          from: query,
          default: 0,
        },
        snapshot: {
          from: query,
          default: 0,
        },
      },
    },
    [VM_DISK_SNAP_REVERT]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        disk: {
          from: postBody,
          default: 0,
        },
        snapshot: {
          from: postBody,
          default: 0,
        },
      },
    },
    [VM_DISK_SNAP_RENAME]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        disk: {
          from: postBody,
          default: 0,
        },
        snapshot: {
          from: postBody,
          default: 0,
        },
        name: {
          from: postBody,
          default: '',
        },
      },
    },
    [VM_DISK_ATTACH]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        template: {
          from: postBody,
          default: '',
        },
      },
    },
    [VM_DISK_DETACH]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        disk: {
          from: postBody,
          default: 0,
        },
      },
    },
    [VM_DISK_RESIZE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        disk: {
          from: postBody,
          default: 0,
        },
        size: {
          from: postBody,
          default: '',
        },
      },
    },
    [VM_NIC_ATTACH]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        template: {
          from: postBody,
          default: '',
        },
      },
    },
    [VM_NIC_DETACH]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        nic: {
          from: postBody,
          default: 0,
        },
      },
    },
    [VM_NIC_UPDATE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        nic: {
          from: postBody,
          default: 0,
        },
        template: {
          from: postBody,
          default: '',
        },
        append: {
          from: postBody,
          default: 0,
        },
      },
    },
    [VM_SEC_GROUP_ATTACH]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        nic: {
          from: postBody,
          default: 0,
        },
        secgroup: {
          from: postBody,
          default: 0,
        },
      },
    },
    [VM_SEC_GROUP_DETACH]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        nic: {
          from: postBody,
          default: 0,
        },
        secgroup: {
          from: postBody,
          default: 0,
        },
      },
    },
    [VM_CHMOD]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        ownerUse: {
          from: postBody,
          default: -1,
        },
        ownerManage: {
          from: postBody,
          default: -1,
        },
        ownerAdmin: {
          from: postBody,
          default: -1,
        },
        groupUse: {
          from: postBody,
          default: -1,
        },
        groupManage: {
          from: postBody,
          default: -1,
        },
        groupAdmin: {
          from: postBody,
          default: -1,
        },
        otherUse: {
          from: postBody,
          default: -1,
        },
        otherManage: {
          from: postBody,
          default: -1,
        },
        otherAdmin: {
          from: postBody,
          default: -1,
        },
      },
    },
    [VM_CHOWN]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        user: {
          from: postBody,
          default: -1,
        },
        group: {
          from: postBody,
          default: -1,
        },
      },
    },
    [VM_RENAME]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        name: {
          from: postBody,
          default: '',
        },
      },
    },
    [VM_SNAP_CREATE]: {
      // inspected
      httpMethod: POST,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        name: {
          from: postBody,
          default: '',
        },
      },
    },
    [VM_SNAP_REVERT]: {
      // inspected
      httpMethod: POST,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        snapshot: {
          from: postBody,
          default: 0,
        },
      },
    },
    [VM_SNAP_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        snapshot: {
          from: postBody,
          default: 0,
        },
      },
    },
    [VM_RESIZE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        template: {
          from: postBody,
          default: '',
        },
        enforce: {
          from: postBody,
          default: false,
        },
      },
    },
    [VM_UPDATE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        template: {
          from: postBody,
          default: '',
        },
        replace: {
          from: postBody,
          default: 0,
        },
      },
    },
    [VM_CONF_UPDATE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        template: {
          from: postBody,
          default: '',
        },
      },
    },
    [VM_RECOVER]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        operation: {
          from: postBody,
          default: 1,
        },
      },
    },
    [VM_INFO]: {
      // inspected
      httpMethod: GET,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        decrypt: {
          from: query,
          default: false,
        },
      },
    },
    [VM_MONITORING]: {
      // inspected
      httpMethod: GET,
      params: {
        id: {
          from: resource,
          default: 0,
        },
      },
    },
    [VM_LOCK]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        level: {
          from: postBody,
          default: 4,
        },
        test: {
          from: postBody,
          default: false,
        },
      },
    },
    [VM_UNLOCK]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
      },
    },
    [VM_SCHED_ADD]: {
      httpMethod: POST,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        template: {
          from: postBody,
          default: '',
        },
      },
    },
    [VM_SCHED_UPDATE]: {
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        schedId: {
          from: postBody,
          default: 0,
        },
        template: {
          from: postBody,
          default: '',
        },
      },
    },
    [VM_SCHED_DELETE]: {
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        schedId: {
          from: postBody,
          default: 0,
        },
      },
    },
    [VM_BACKUP]: {
      httpMethod: POST,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        dsId: {
          from: postBody,
          default: 0,
        },
        reset: {
          from: postBody,
          default: false,
        },
      },
    },
    [VM_POOL_INFO]: {
      // inspected
      httpMethod: GET,
      params: {
        filter: {
          from: query,
          default: -2,
        },
        start: {
          from: query,
          default: -1,
        },
        end: {
          from: query,
          default: -1,
        },
        state: {
          from: query,
          default: -1,
        },
        filterByKey: {
          from: query,
          default: '',
        },
      },
    },
    [VM_POOL_INFO_EXTENDED]: {
      // inspected
      httpMethod: GET,
      params: {
        filter: {
          from: query,
          default: -2,
        },
        start: {
          from: query,
          default: -1,
        },
        end: {
          from: query,
          default: -1,
        },
        state: {
          from: query,
          default: -1,
        },
        filterBykey: {
          from: query,
          default: '',
        },
      },
    },
    [VM_POOL_MONITORING]: {
      // inspected
      httpMethod: GET,
      params: {
        filter: {
          from: query,
          default: -2,
        },
        seconds: {
          from: query,
          default: -1,
        },
      },
    },
    [VM_POOL_ACCOUNTING]: {
      // inspected
      httpMethod: GET,
      params: {
        filter: {
          from: query,
          default: -2,
        },
        start: {
          from: query,
          default: -1,
        },
        end: {
          from: query,
          default: -1,
        },
      },
    },
    [VM_POOL_SHOWBACK]: {
      // inspected
      httpMethod: GET,
      params: {
        filter: {
          from: query,
          default: -2,
        },
        startMonth: {
          from: query,
          default: -1,
        },
        startYear: {
          from: query,
          default: -1,
        },
        endMonth: {
          from: query,
          default: -1,
        },
        endYear: {
          from: query,
          default: -1,
        },
      },
    },
    [VM_POOL_CALCULATE_SHOWBACK]: {
      // inspected
      httpMethod: GET,
      params: {
        startMonth: {
          from: query,
          default: -1,
        },
        startYear: {
          from: query,
          default: -1,
        },
        endMonth: {
          from: query,
          default: -1,
        },
        endYear: {
          from: query,
          default: -1,
        },
      },
    },
  },
}
