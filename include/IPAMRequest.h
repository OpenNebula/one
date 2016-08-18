/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

#ifndef IPAM_REQUEST_H_
#define IPAM_REQUEST_H_

#include <time.h>
#include <set>

#include "ActionManager.h"
#include "IPAMManager.h"
#include "NebulaUtil.h"

#include "SyncRequest.h"

using namespace std;

/**
 *  The IPAMRequest class is used to pass an Authorization or Authentication
 *  request to the AuthManager. The result of the request will be stored
 *  in the result and message attributes of this class.
 */
class IPAMRequest : public SyncRequest
{
public:
    IPAMRequest(string _params): params(_params){};

    ~IPAMRequest(){};

private:

    friend class IPAMManager;

    /**
     *  The params for this request
     */
    string    params;

};

#endif
