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
  'template.allocate': {
    // inspected
    httpMethod: PUT,
    params: {
      template: {
        from: postBody,
        default: ''
      }
    }
  },
  'template.clone': {
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
      },
      image: {
        from: postBody,
        default: false
      }
    }
  },
  'template.delete': {
    // inspected
    httpMethod: DELETE,
    params: {
      id: {
        from: resource,
        default: 0
      },
      image: {
        from: query,
        default: false
      }
    }
  },
  'template.instantiate': {
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
      },
      pending: {
        from: postBody,
        default: false
      },
      template: {
        from: postBody,
        default: ''
      },
      image: {
        from: postBody,
        default: false
      }
    }
  },
  'template.update': {
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
  'template.chmod': {
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
      },
      image: {
        from: postBody,
        default: false
      }
    }
  },
  'template.chown': {
    // inspected
    httpMethod: PUT,
    params: {
      id: {
        from: resource,
        default: 0
      },
      user_id: {
        from: postBody,
        default: -1
      },
      group_id: {
        from: postBody,
        default: -1
      }
    }
  },
  'template.rename': {
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
  'template.info': {
    // inspected
    httpMethod: GET,
    params: {
      id: {
        from: resource,
        default: 0
      },
      extended: {
        from: query,
        default: false
      },
      decrypt: {
        from: query,
        default: false
      }
    }
  },
  'templatepool.info': {
    // inspected
    httpMethod: GET,
    params: {
      filter: {
        from: query,
        default: -1
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
  'template.lock': {
    // inspected
    httpMethod: PUT,
    params: {
      id: {
        from: resource,
        default: 0
      },
      lock: {
        from: postBody,
        default: 4
      }
    }
  },
  'template.unlock': {
    // inspected
    httpMethod: GET,
    params: {
      id: {
        from: resource,
        default: 0
      }
    }
  }
});
