/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#ifndef USER_QUOTAS_H_
#define USER_QUOTAS_H_

#include "Quotas.h"

class UserQuotas : public Quotas
{
public:
    UserQuotas():Quotas(
            "/QUOTAS/DATASTORE_QUOTA",
            "/QUOTAS/NETWORK_QUOTA",
            "/QUOTAS/IMAGE_QUOTA",
            "/QUOTAS/VM_QUOTA"){};

    // *************************************************************************
    // DataBase implementation
    // *************************************************************************

    static const char * db_names;
    static const char * db_bootstrap;
    static const char * db_table;
    static const char * db_oid_column;

protected:

    const char * table() const
    {
        return db_table;
    };

    const char * table_names() const
    {
        return db_names;
    };

    const char * table_oid_column() const
    {
        return db_oid_column;
    };
};

#endif /*USER_QUOTAS_H_*/
