/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#ifndef SYNC_REQUEST_H_
#define SYNC_REQUEST_H_

#include <time.h>

#include "Listener.h"

/**
 *  Base class to implement synchronous operation in the MadManagers. This class
 *  cannot be directly instantiated.
 */
class SyncRequest: public Listener
{
public:
    SyncRequest():
        Listener(""),
        result(false),
        message(""),
        timeout(false),
        id(-1),
        time_out(0)
    {
    }

    virtual ~SyncRequest() = default;

    /**
     *  The result of the request, true if the operation succeeded
     */
    bool   result;

    /**
     *  Error message for negative results
     */
    std::string message;

    /**
     *  Time out, true if the request ended because of a time out
     */
    bool   timeout;

    /**
     *  Identification of this request
     */
    int    id;

    /**
     *  Notify client that we have an answer for the request
     */
    void notify()
    {
        finalize();
    }

    /**
     *  Wait for the AuthRequest to be completed
     */
    void wait(time_t tout = 90)
    {
        time_out = time(0) + tout;//Requests will expire in 1.5 minutes

        loop();
    }

    /**
     *  Time in seconds when this request will expire
     */
    time_t  time_out;
};

#endif /*SYNC_REQUEST_H_*/
