/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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

#ifndef USER_TEMPLATE_H_
#define USER_TEMPLATE_H_

#include "Template.h"

/**
 *  User Template class, it represents the attributes of an user
 */
class UserTemplate : public Template
{
public:
    UserTemplate() : Template(true,'=',"TEMPLATE") {}

    ~UserTemplate() = default;

    // -------------------------------------------------------------------------
    // Restricted attributes interface implementation
    // -------------------------------------------------------------------------
    bool check_restricted(string& rs_attr, const Template* base) override
    {
        return Template::check_restricted(rs_attr, base, restricted);
    }

    bool check_restricted(string& rs_attr) override
    {
        return Template::check_restricted(rs_attr, restricted);
    }

    static void parse_restricted(vector<const SingleAttribute *>& ra)
    {
        Template::parse_restricted(ra, restricted);
    }

private:
    /**
     *  Restricted attribute list for UserTemplate
     */
    static std::map<std::string, std::set<std::string>> restricted;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*USER_TEMPLATE_H_*/
