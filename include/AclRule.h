/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

#ifndef ACL_RULE_H_
#define ACL_RULE_H_

#include <set>

#include "ObjectSQL.h"

using namespace std;

class AclRule
{
public:

    static const long long INDIVIDUAL_ID;
    static const long long GROUP_ID;
    static const long long ALL_ID;

    AclRule(long long _user, long long _resource, long long _rights):
        user(_user), resource(_resource), rights(_rights)
    {};

    AclRule& operator=(AclRule const& o)
    {
        user = o.user;
        resource = o.resource;
        rights = o.rights;

        return *this;
    };

    bool operator ==(const AclRule& other) const
    {
        return (user == other.user &&
                resource == other.resource &&
                rights == other.rights);
    };

    bool operator!=(const AclRule& other) const
    {
        return !(*this == other);
    };

    bool operator <(const AclRule& other) const
    {
        return user < other.user;
    };

    string to_str() const;

    string& to_xml(string& xml) const;

    int user_id() const
    {
        return user;
    };

    long long user_code() const
    {
        return user & 0xFFFFFFFF00000000LL;
    };

    int resource_id() const
    {
        return resource;
    };

    long long resource_code() const
    {
        return resource & 0xFFFFFFFF00000000LL;
    };

private:

    friend class AclManager;

    /**
     *
     */
    long long user;

    /**
     *
     */
    long long resource;

    /**
     *
     */
    long long rights;
};

#endif /*ACL_RULE_H*/

