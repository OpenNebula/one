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

module.exports = (
  { resource, postBody, query },
  { GET, POST, PUT, DELETE }
) => ({
  'vm.allocate': {
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
  'vm.deploy': {
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
  'vm.action': {
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
  'vm.migrate': {
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
  'vm.disksaveas': {
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
  'vm.disksnapshotcreate': {
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
  'vm.disksnapshotdelete': {
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
  'vm.disksnapshotrevert': {
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
  'vm.disksnapshotrename': {
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
  'vm.attach': {
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
  'vm.detach': {
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
  'vm.diskresize': {
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
  'vm.attachnic': {
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
  'vm.detachnic': {
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
  'vm.chmod': {
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
  'vm.chown': {
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
  'vm.rename': {
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
  'vm.snapshotcreate': {
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
  'vm.snapshotrevert': {
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
  'vm.snapshotdelete': {
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
  'vm.resize': {
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
  'vm.update': {
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
  'vm.updateconf': {
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
  'vm.recover': {
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
  'vm.info': {
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
  'vm.monitoring': {
    // inspected
    httpMethod: GET,
    params: {
      id: {
        from: resource,
        default: 0
      }
    }
  },
  'vm.lock': {
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
  'vm.unlock': {
    // inspected
    httpMethod: PUT,
    params: {
      id: {
        from: resource,
        default: 0
      }
    }
  },
  'vmpool.info': {
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
  'vmpool.infoextended': {
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
  'vmpool.monitoring': {
    // inspected
    httpMethod: GET,
    params: {
      filter: {
        from: query,
        default: -2
      }
    }
  },
  'vmpool.accounting': {
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
  'vmpool.showback': {
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
  'vmpool.calculateshowback': {
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
});
