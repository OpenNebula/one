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
  'vdc.allocate': {
    // inspected
    httpMethod: POST,
    params: {
      template: {
        from: postBody,
        default: ''
      },
      cluster: {
        from: postBody,
        default: -1
      }
    }
  },
  'vdc.delete': {
    // inspected
    httpMethod: DELETE,
    params: {
      id: {
        from: resource,
        default: 0
      }
    }
  },
  'vdc.update': {
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
  'vdc.rename': {
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
  'vdc.info': {
    // inspected
    httpMethod: GET,
    params: {
      id: {
        from: resource,
        default: -1
      },
      decrypt: {
        from: query,
        default: false
      }
    }
  },
  'vdcpool.info': {
    // inspected
    httpMethod: GET,
    params: {}
  },
  'vdc.addgroup': {
    // inspected
    httpMethod: POST,
    params: {
      id: {
        from: resource,
        default: 0
      },
      group: {
        from: postBody,
        default: 0
      }
    }
  },
  'vdc.delgroup': {
    // inspected
    httpMethod: DELETE,
    params: {
      id: {
        from: resource,
        default: 0
      },
      group: {
        from: query,
        default: 0
      }
    }
  },
  'vdc.addcluster': {
    // inspected
    httpMethod: POST,
    params: {
      id: {
        from: resource,
        default: 0
      },
      zone: {
        from: postBody,
        default: 0
      },
      cluster: {
        from: postBody,
        default: 0
      }
    }
  },
  'vdc.delcluster': {
    // inspected
    httpMethod: DELETE,
    params: {
      id: {
        from: resource,
        default: 0
      },
      zone: {
        from: query,
        default: 0
      },
      cluster: {
        from: query,
        default: 0
      }
    }
  },
  'vdc.addhost': {
    // inspected
    httpMethod: POST,
    params: {
      id: {
        from: resource,
        default: 0
      },
      zone: {
        from: postBody,
        default: 0
      },
      host: {
        from: postBody,
        default: 0
      }
    }
  },
  'vdc.delhost': {
    // inspected
    httpMethod: DELETE,
    params: {
      id: {
        from: resource,
        default: 0
      },
      zone: {
        from: postBody,
        default: 0
      },
      host: {
        from: postBody,
        default: 0
      }
    }
  },
  'vdc.adddatastore': {
    // inspected
    httpMethod: POST,
    params: {
      id: {
        from: resource,
        default: 0
      },
      zone: {
        from: postBody,
        default: 0
      },
      datastore: {
        from: postBody,
        default: 0
      }
    }
  },
  'vdc.deldatastore': {
    // inspected
    httpMethod: DELETE,
    params: {
      id: {
        from: resource,
        default: 0
      },
      zone: {
        from: postBody,
        default: 0
      },
      datastore: {
        from: postBody,
        default: 0
      }
    }
  },
  'vdc.addvnet': {
    // inspected
    httpMethod: POST,
    params: {
      id: {
        from: resource,
        default: 0
      },
      zone: {
        from: postBody,
        default: 0
      },
      vnet: {
        from: postBody,
        default: 0
      }
    }
  },
  'vdc.delvnet': {
    // inspected
    httpMethod: DELETE,
    params: {
      id: {
        from: resource,
        default: 0
      },
      zone: {
        from: query,
        default: 0
      },
      vnet: {
        from: query,
        default: 0
      }
    }
  }
});
