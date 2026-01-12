/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#ifndef VIRTUAL_MACHINE_POOL_API_H
#define VIRTUAL_MACHINE_POOL_API_H

#include "PoolSharedAPI.h"
#include "Nebula.h"
#include "VirtualMachinePool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachinePoolAPI : public PoolSharedAPI
{
protected:

    VirtualMachinePoolAPI(Request &r)
        : PoolSharedAPI(r)
    {
        request.auth_object(PoolObjectSQL::VM);

        vmpool = Nebula::instance().get_vmpool();
        pool = vmpool;
    }

    /* API calls */
    Request::ErrorCode info(int filter_flag,
                            int start_id,
                            int end_id,
                            int state,
                            const std::string& json_query,
                            std::string& xml,
                            RequestAttributes& att);

    Request::ErrorCode info_extended(int filter_flag,
                                     int start_id,
                                     int end_id,
                                     int state,
                                     const std::string& json_query,
                                     std::string& xml,
                                     RequestAttributes& att);

    Request::ErrorCode info_set(const std::string& ids_str,
                                bool extended,
                                std::string& xml,
                                RequestAttributes& att);

    Request::ErrorCode monitoring(int filter_flag,
                                  int seconds,
                                  std::string& xml,
                                  RequestAttributes& att);

    Request::ErrorCode accounting(int filter_flag,
                                  int time_start,
                                  int time_end,
                                  std::string& xml,
                                  RequestAttributes& att);

    Request::ErrorCode showback_calc(int start_month,
                                     int start_year,
                                     int end_month,
                                     int end_year,
                                     RequestAttributes& att);

    Request::ErrorCode showback_list(int filter_flag,
                                     int start_month,
                                     int start_year,
                                     int end_month,
                                     int end_year,
                                     std::string& xml,
                                     RequestAttributes& att);

    /* Helpers */

    VirtualMachinePool* vmpool;
};

#endif
