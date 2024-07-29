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

#ifndef ACL_RULE_H_
#define ACL_RULE_H_

#include <string>
#include <libxml/tree.h>

#include "PoolObjectSQL.h"
#include "AuthRequest.h"


/**
 *  An ACL Rule is composed of three 64 bit numbers: user, resource and rights.
 *  These attributes store a combination of IDs and flags
 */
class AclRule
{
public:

    // ------------------------------------------------------------------------
    static const long long INDIVIDUAL_ID;

    static const long long GROUP_ID;

    static const long long ALL_ID;

    static const long long CLUSTER_ID;
    // ------------------------------------------------------------------------

    /**
     *  Creates an empty ACL rule
     */
    AclRule():oid(0), user(0), resource(0), rights(0), zone(0), str("") {};

    /**
     *  Main ACL rule constructor
     */
    AclRule(int       _oid,
            long long _user,
            long long _resource,
            long long _rights,
            long long _zone):
        oid(_oid), user(_user), resource(_resource),
        rights(_rights), zone(_zone)
    {
        build_str();
    };

    /**
     *  Set the fields of the ACL, and updates its representation
     */
    void set(int       _oid,
             long long _user,
             long long _resource,
             long long _rights,
             long long _zone)
    {
        oid      = _oid;
        user     = _user;
        resource = _resource;
        rights   = _rights;
        zone     = _zone;

        build_str();
    };

    /**
     *  Compares two ACL rules
     */
    bool operator ==(const AclRule& other) const
    {
        return (user     == other.user &&
                resource == other.resource &&
                rights   == other.rights &&
                zone     == other.zone);
    };

    /**
     *  Returns a human readable string for this rule
     *
     *    @return a human readable string for this rule
     */
    const std::string& to_str() const
    {
        return str;
    };

    /**
     *  Returns whether or not the rule is malformed.
     *
     *    @param error_str Returns the error message, if any
     *    @return true if the rule is wrong
     */
    bool malformed(std::string& error_str) const;

    /**
     *  Function to print the object into a string in XML format
     *
     *    @param xml the resulting XML string
     *    @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml) const;

    /**
     *  Rebuilds the rule from an xml formatted string
     *
     *    @param node xml node for the ACL rule
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(xmlNodePtr node);

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

    /**
     *  Returns the 32 less significant bits of the zone long long attribute
     *
     *    @return the zone ID
     */
    int zone_id() const
    {
        return zone;
    };

    // ------------------------------------------------------------------------
    // Functions needed by the Scheduler ACL engine
    // ------------------------------------------------------------------------

    long long get_user() const
    {
        return user;
    }

    long long get_oid() const
    {
        return oid;
    }

private:
    // NONE_ID can never be used in a rule. It is useful to create masks that
    // will never match any existing rule
    static const long long NONE_ID;

    friend class AclManager;

    /**
     *  Rule unique identifier
     */
    int oid;

    /**
     *  64 bit integer holding a user compound:
     *
     *           32 bits                 32 bits
     *  +-----------------------+-----------------------+
     *  | Type (user,group,all) | user/group ID         |
     *  +-----------------------+-----------------------+
     */
    long long user;

    /**
     *  64 bit integer holding a resource compound
     *
     *           32 bits                 32 bits
     *  +-----------------------+-----------------------+
     *  | Type (VM, Host...)    | resource ID           |
     *  +-----------------------+-----------------------+
     */
    long long resource;

    /**
     *  64 bit integer containing the rights flags
     *
     *                      64 bits
     *  +-----------------------------------------------+
     *  | Actions (MANAGE, CREATE, USE...               |
     *  +-----------------------------------------------+
     */
    long long rights;

    /**
     *  64 bit integer holding a zone compound:
     *
     *           32 bits                 32 bits
     *  +-----------------------+-----------------------+
     *  | Type (individual,all) | zone ID               |
     *  +-----------------------+-----------------------+
     */
    long long zone;

    /**
     *  Human readable representation of the rule
     */
    std::string str;

    /**
     *  Builds the human representation of the ACL
     */
    void build_str();

    /**
     *  Array of PoolObjectSQL types to iterate over all types
     */
    static const std::array<PoolObjectSQL::ObjectType, 19> pool_objects;

    /**
     *  Array of Auth operation types to iterate over all types
     */
    static const std::array<AuthRequest::Operation, 4> auth_operations;

    /**
     *  Objects that cannot be used with the CLUSTER(%) selector
     */
    static const long long INVALID_CLUSTER_OBJECTS;

    /**
     *  Objects that cannot be used with the GROUP(@) selector
     */
    static const long long INVALID_GROUP_OBJECTS;

    static const long long FEDERATED_OBJECTS;
};

#endif /*ACL_RULE_H*/

