/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

const {
  from: { resource, postBody, query },
  httpMethod: { GET, POST, PUT, DELETE }
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
  VM_POOL_INFO,
  VM_POOL_INFO_EXTENDED,
  VM_POOL_MONITORING,
  VM_POOL_ACCOUNTING,
  VM_POOL_SHOWBACK,
  VM_POOL_CALCULATE_SHOWBACK
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
          default: ''
        },
        status: {
          from: postBody,
          default: false
        }
      }
    },
    [VM_DEPLOY]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        host: {
          from: postBody,
          default: 0
        },
        enforce: {
          from: postBody,
          default: false
        },
        datastore: {
          from: postBody,
          default: -1
        }
      }
    },
    [VM_ACTION]: {
      // inspected
      httpMethod: PUT,
      params: {
        action: {
          from: postBody,
          default: 'stop'
        },
        id: {
          from: resource,
          default: 0
        }
      }
    },
    [VM_MIGRATE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        host: {
          from: postBody,
          default: 0
        },
        livemigration: {
          from: postBody,
          default: false
        },
        enforce: {
          from: postBody,
          default: false
        },
        datastore: {
          from: postBody,
          default: 0
        },
        migration: {
          from: postBody,
          default: 0
        }
      }
    },
    [VM_DISK_SAVEAS]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        disk: {
          from: postBody,
          default: 0
        },
        name: {
          from: postBody,
          default: ''
        },
        type: {
          from: postBody,
          default: ''
        },
        snapshot: {
          from: postBody,
          default: -1
        }
      }
    },
    [VM_DISK_SNAP_CREATE]: {
      // inspected
      httpMethod: POST,
      params: {
        id: {
          from: resource,
          default: 0
        },
        disk: {
          from: postBody,
          default: 0
        },
        description: {
          from: postBody,
          default: ''
        }
      }
    },
    [VM_DISK_SNAP_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: 0
        },
        disk: {
          from: query,
          default: 0
        },
        snapshot: {
          from: query,
          default: 0
        }
      }
    },
    [VM_DISK_SNAP_REVERT]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        disk: {
          from: postBody,
          default: 0
        },
        snapshot: {
          from: postBody,
          default: 0
        }
      }
    },
    [VM_DISK_SNAP_RENAME]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        disk: {
          from: postBody,
          default: 0
        },
        snapshot: {
          from: postBody,
          default: 0
        },
        name: {
          from: postBody,
          default: ''
        }
      }
    },
    [VM_DISK_ATTACH]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        template: {
          from: postBody,
          default: ''
        }
      }
    },
    [VM_DISK_DETACH]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        disk: {
          from: postBody,
          default: 0
        }
      }
    },
    [VM_DISK_RESIZE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        disk: {
          from: postBody,
          default: 0
        },
        size: {
          from: postBody,
          default: ''
        }
      }
    },
    [VM_NIC_ATTACH]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        template: {
          from: postBody,
          default: ''
        }
      }
    },
    [VM_NIC_DETACH]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        nic: {
          from: postBody,
          default: 0
        }
      }
    },
    [VM_CHMOD]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        user_use: {
          from: postBody,
          default: -1
        },
        user_manage: {
          from: postBody,
          default: -1
        },
        user_admin: {
          from: postBody,
          default: -1
        },
        group_use: {
          from: postBody,
          default: -1
        },
        group_manage: {
          from: postBody,
          default: -1
        },
        group_admin: {
          from: postBody,
          default: -1
        },
        other_use: {
          from: postBody,
          default: -1
        },
        other_manage: {
          from: postBody,
          default: -1
        },
        other_admin: {
          from: postBody,
          default: -1
        }
      }
    },
    [VM_CHOWN]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        user: {
          from: postBody,
          default: -1
        },
        group: {
          from: postBody,
          default: -1
        }
      }
    },
    [VM_RENAME]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        name: {
          from: postBody,
          default: ''
        }
      }
    },
    [VM_SNAP_CREATE]: {
      // inspected
      httpMethod: POST,
      params: {
        id: {
          from: resource,
          default: 0
        },
        name: {
          from: postBody,
          default: ''
        }
      }
    },
    [VM_SNAP_REVERT]: {
      // inspected
      httpMethod: POST,
      params: {
        id: {
          from: resource,
          default: 0
        },
        snapshot: {
          from: postBody,
          default: 0
        }
      }
    },
    [VM_SNAP_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: 0
        },
        snapshot: {
          from: postBody,
          default: 0
        }
      }
    },
    [VM_RESIZE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        template: {
          from: postBody,
          default: ''
        },
        enforce: {
          from: postBody,
          default: false
        }
      }
    },
    [VM_UPDATE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        template: {
          from: postBody,
          default: ''
        },
        replace: {
          from: postBody,
          default: 0
        }
      }
    },
    [VM_CONF_UPDATE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        template: {
          from: resource,
          default: ''
        }
      }
    },
    [VM_RECOVER]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        operation: {
          from: postBody,
          default: 1
        }
      }
    },
    [VM_INFO]: {
      // inspected
      httpMethod: GET,
      params: {
        id: {
          from: resource,
          default: 0
        },
        decrypt: {
          from: query,
          default: false
        }
      }
    },
    [VM_MONITORING]: {
      // inspected
      httpMethod: GET,
      params: {
        id: {
          from: resource,
          default: 0
        }
      }
    },
    [VM_LOCK]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        level: {
          from: postBody,
          default: 4
        }
      }
    },
    [VM_UNLOCK]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        }
      }
    },
    [VM_POOL_INFO]: {
      // inspected
      httpMethod: GET,
      params: {
        filter: {
          from: query,
          default: -2
        },
        start: {
          from: query,
          default: -1
        },
        end: {
          from: query,
          default: -1
        },
        state: {
          from: query,
          default: -2
        },
        filterbykey: {
          from: query,
          default: ''
        }
      }
    },
    [VM_POOL_INFO_EXTENDED]: {
      // inspected
      httpMethod: GET,
      params: {
        filter: {
          from: query,
          default: -2
        },
        start: {
          from: query,
          default: -1
        },
        end: {
          from: query,
          default: -1
        },
        state: {
          from: query,
          default: -2
        },
        filterbykey: {
          from: query,
          default: ''
        }
      }
    },
    [VM_POOL_MONITORING]: {
      // inspected
      httpMethod: GET,
      params: {
        filter: {
          from: query,
          default: -2
        }
      }
    },
    [VM_POOL_ACCOUNTING]: {
      // inspected
      httpMethod: GET,
      params: {
        filter: {
          from: query,
          default: -2
        },
        start: {
          from: query,
          default: -1
        },
        end: {
          from: query,
          default: -1
        }
      }
    },
    [VM_POOL_SHOWBACK]: {
      // inspected
      httpMethod: GET,
      params: {
        filter: {
          from: query,
          default: -2
        },
        start_month: {
          filter: query,
          default: -1
        },
        start_year: {
          filter: query,
          default: -1
        },
        end_month: {
          filter: query,
          default: -1
        },
        end_year: {
          filter: query,
          default: -1
        }
      }
    },
    [VM_POOL_CALCULATE_SHOWBACK]: {
      // inspected
      httpMethod: GET,
      params: {
        start_month: {
          filter: query,
          default: -1
        },
        start_year: {
          filter: query,
          default: -1
        },
        end_month: {
          filter: query,
          default: -1
        },
        end_year: {
          filter: query,
          default: -1
        }
      }
    }
  }
}
