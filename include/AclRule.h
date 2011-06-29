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

/**
 *  An ACL Rule is composed of three 64 bit numbers: user, resource and rights.
 *  These attributes store a combination of IDs and flags
 */
class AclRule
{
public:

    static const long long INDIVIDUAL_ID;
    static const long long GROUP_ID;
    static const long long ALL_ID;

    AclRule(int _oid, long long _user, long long _resource, long long _rights):
        oid(_oid), user(_user), resource(_resource), rights(_rights)
    {
        build_str();
    };

    bool operator ==(const AclRule& other) const
    {
        return (user == other.user &&
                resource == other.resource &&
                rights == other.rights);
    };

    /**
     *  Returns a human readable string for this rule
     *
     *    @return a human readable string for this rule
     */
    const string& to_str() const
    {
        return str;
    };

    /**
     *  Returns whether or not the rule is malformed.
     *
     *    @param error_str Returns the error message, if any
     *    @return true if the rule is wrong
     */
    bool malformed(string& error_str) const;

    /**
     *  Function to print the object into a string in XML format
     *
     *    @param xml the resulting XML string
     *    @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

    /**
     *  Returns the 32 less significant bits of the user long long attribute
     *
     *    @return the user or group ID
     */
    int user_id() const
    {
        return user;
    };

    /**
     *  Returns the 64 bit user attribute with the ID cleared (the 32 less
     *  significant bits are set to 0)
     *
     *    @return the user flags
     */
    long long user_code() const
    {
        return user & 0xFFFFFFFF00000000LL;
    };

    /**
     *  Returns the 32 less significant bits of the resource long long attribute
     *
     *    @return the resource ID
     */
    int resource_id() const
    {
        return resource;
    };

    /**
     *  Returns the 64 bit resource attribute with the ID cleared (the 32 less
     *  significant bits are set to 0)
     *
     *    @return the resource flags
     */
    long long resource_code() const
    {
        return resource & 0xFFFFFFFF00000000LL;
    };

private:

    friend class AclManager;

    /**
     *  Rule unique identifier
     */
    int oid;

    /**
     *  64 bit integer holding a user ID in the 32 less significant bits,
     *  and a flag indicating the kind of ID in the other 32
     */
    long long user;

    /**
     *  64 bit integer holding an object ID in the 32 less significant bits,
     *  and flags indicanting the kind of ID and object in the other 32
     */
    long long resource;

    /**
     *  64 bit integer containing the rights flags
     */
    long long rights;

    /**
     *  Human readable representation
     */
    string str;

    void build_str();
};

#endif /*ACL_RULE_H*/

