/* -------------------------------------------------------------------------- */
/* Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                */
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

#ifndef GROUP_VLANS_H_
#define GROUP_VLANS_H_

#include "ObjectSQL.h"
#include "Template.h"
#include "OneDB.h"

#include <utility>
#include <vector>

class ObjectXML;

/**
 *  The GroupVlans class.
 */
class GroupVlans : public ObjectSQL
{
public:
    GroupVlans(): ObjectSQL(), oid(-1), vlan_template(false, '=', "VLAN_RULES") {};

    /**
     *  Parsed representation of a group VLAN rule. It normalizes the SCOPE,
     *  VLAN ID ranges, and optional VN Template ranges so validation and
     *  authorization checks do not need to parse the raw VectorAttribute.
     */
    class VlanRule
    {
    public:
        /**
         *  VLAN rule scope
         */
        enum Scope
        {
            VLAN_ID        = 0,
            OUTER_VLAN_ID  = 1,
            CVLAN          = 2,
            VLAN_TAGGED_ID = 3,
            ANY            = 4,
            UNDEFINED      = 255
        };

        /**
         *  Return the string representation of a Scope
         *    @param scope the scope
         *    @return the string
         */
        static std::string scope_to_str(Scope scope)
        {
            switch (scope)
            {
                case VLAN_ID:        return "VLAN_ID" ; break;
                case OUTER_VLAN_ID:  return "OUTER_VLAN_ID" ; break;
                case CVLAN:          return "CVLAN" ; break;
                case VLAN_TAGGED_ID: return "VLAN_TAGGED_ID" ; break;
                case ANY:            return "ANY" ; break;
                default:             return "";
            }
        };

        /**
         *  Return the Scope for its string representation
         *    @param str_scope string representing the scope
         *    @return the Scope
         */
        static Scope str_to_scope(std::string& str_scope);

        VlanRule() = default;

        /**
         *  Parses a range into its vector format
         *
         *  @return false if the range is not valid
         */
        static bool parse_range(const std::string& range_s,
                                std::vector<std::pair<int, int>>& ranges,
                                std::string& error_str);

        /**
         *  Parse a VLAN rule from a VectorAttribute.
         *    @param rule group VLAN rule, including ID, SCOPE and optionally
         *    VNTEMPLATE
         *    @param error_str error message if the rule cannot be parsed
         *
         *  Example: RULE = [ ID="5,6,100-200", SCOPE="CVLAN" ] will generate
         *  ranges [{5,5}, {6,6}, {100,200}] and scope CVLAN.
         *
         *  Note: reversed ranges are considered valid, e.g. 300-100 is parsed
         *  as {100,300}.
         */
        bool build_rule(const VectorAttribute * rule, std::string& error_str);

        Scope scope() const
        {
            return _scope;
        }

        const std::vector<std::pair<int, int>>& ranges() const
        {
            return _ranges;
        }

        const std::vector<std::pair<int, int>>& vntemplates() const
        {
            return _vntemplates;
        }

    private:
        static bool parse_range(const VectorAttribute* rule,
                                const std::string& attr,
                                std::vector<std::pair<int, int>>& ranges,
                                std::string& error_str);

        Scope _scope = UNDEFINED;

        std::vector<std::pair<int, int>> _ranges;

        std::vector<std::pair<int, int>> _vntemplates;
    };


    /**
     *  Reads the ObjectSQL (identified with its OID) from the database.
     *    @param oid the Group oid
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select(int _oid, SqlDB *db)
    {
        oid = _oid;
        return select(db);
    };

    /**
     *  Writes the VLAN rules in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(int _oid, SqlDB *db, std::string& error_str)
    {
        oid = _oid;
        return insert(db, error_str);
    };

    /**
     *  Writes/updates the VLAN rules fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(int _oid, SqlDB *db)
    {
        oid = _oid;
        return update(db);
    }

    /**
     *  Removes the VLAN rules from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int drop(SqlDB * db) override;

    /**
     *  Bootstraps the database table for group vlans
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        std::ostringstream oss(one_db::group_vlans_db_bootstrap);

        return db->exec_local_wr(oss);
    };

    /**
     *  Set the VLAN rules
     *    @param tmpl contains the VLAN rules
     *    @param error describes error when setting the rules
     *
     *    @return 0 on success, -1 otherwise
     */
    int set(Template *tmpl, std::string& error);

    /**
     *  Generates a string representation of the VLAN rules in XML format
     *    @param xml the string to store the XML
     *    @return the same xml string to use it in << compounds
     */
    std::string& to_xml(std::string& xml) const;

    /**
     *  Builds VLAN rules object from an XML string
     *    @param xml_str the XML string
     *    @return 0 if success
     */
    int from_xml(const std::string& xml_str);

    /**
     *  Check if any VLAN rule applies to a VN Template ID
     *    @param vntemplate_id the VN Template ID
     *    @return true if there are rules for this VN Template
     */
    bool has_vntemplate_rules(int vntemplate_id) const;

    /**
     *  Check if a value for the given scope is allowed by these rules
     *    @param scope VLAN rule scope
     *    @param value VLAN value or ranges
     *    @param vntemplate_id VN Template ID
     *    @param error_str error message if the input cannot be parsed
     *    @return true if allowed
     */
    bool check(VlanRule::Scope scope,
               const std::string& value,
               int vntemplate_id,
               std::string& error_str) const;

private:
    /**
     * Group oid. Must be set before a DB write operation
     */
    int oid;

    /**
     *  The VLAN rules template
     */
    Template vlan_template;

    /**
     *  Parsed VLAN rules
     */
    std::vector<VlanRule> _rules;

    /**
     *  Reads the ObjectSQL (identified with its OID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select(SqlDB * db) override;

    /**
     *  Writes the VLAN rules in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, std::string& error_str) override
    {
        return insert_replace(db, false, error_str);
    };

    /**
     *  Writes/updates the VLAN rules fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db) override
    {
        std::string error_str;
        return insert_replace(db, true, error_str);
    }

    /**
     *  Callback function to read a GroupVlans object
     */
    int select_cb(void *nil, int num, char **values, char **names);

    /**
     *  Execute an INSERT or REPLACE Sql query.
     */
    int insert_replace(SqlDB *db, bool replace, std::string& error_str);

    /**
     * Builds the internal representation of the VlanRules
     */
    bool build_rules(std::string& error_str);

};

#endif /*GROUP_VLANS_H_*/
