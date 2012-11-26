/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

#ifndef DEFAULT_QUOTAS_H_
#define DEFAULT_QUOTAS_H_

#include "Quotas.h"

class DefaultQuotas : public Quotas
{
public:
    DefaultQuotas(const char * _ds_xpath,
           const char * _net_xpath,
           const char * _img_xpath,
           const char * _vm_xpath): 
               Quotas(_ds_xpath, _net_xpath, _img_xpath, _vm_xpath)
    {};

    ~DefaultQuotas(){};

    /**
     *  Set the quotas
     *    @param tmpl contains the user quota limits
     *    @param error describes error when setting the quotas
     *
     *    @return 0 on success, -1 otherwise
     */
    int set(Template *tmpl, string& error)
    {
        return Quotas::set(tmpl, false, error);
    };

private:
};

#endif /*DEFAULT_QUOTAS_H_*/
