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

#ifndef HOOK_H_
#define HOOK_H_

#include <string>

#include "Template.h"
#include "PoolObjectSQL.h"
#include "NebulaUtil.h"

class HookImplementation;

class Hook : public PoolObjectSQL
{
public:

    ~Hook();

    /**
     *  Defines the hook type, so a whole hook class can be masked
     */
    enum HookType
    {
        STATE     = 0x01,
        API       = 0x02,
        UNDEFINED = 0x04
    };

    static std::string hook_type_to_str(HookType ht)
    {
        switch(ht)
        {
            case STATE:     return "state";
            case API:       return "api";
            case UNDEFINED: return "";
        }

        return "";
    };

    static HookType str_to_hook_type(std::string& ht)
    {
        one_util::tolower(ht);

        if (ht == "state")
        {
            return STATE;
        }
        else if (ht == "api")
        {
            return API;
        }

        return UNDEFINED;
    }

    /**
     * Function to print the Hook object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml) const override
    {
        return _to_xml(xml, false);
    }

    /**
     *  Include exection records for the hook
     */
    std::string& to_xml_extended(std::string& xml) const
    {
        return _to_xml(xml, true);
    }

private:

    friend class HookPool;

    // *************************************************************************
    // Constructor/Destructor
    // *************************************************************************

    Hook(std::unique_ptr<Template> tmpl);

    /**
     * Set hook implementation attribute depending of the hook type.
     */
    int set_hook(HookType hook_type, std::string& error);

    /**
     *  Factory method for Hook templates
     */
    std::unique_ptr<Template> get_new_template() const override
    {
        return std::make_unique<Template>();
    }


    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const std::string &xml_str) override;

    /* Checks the mandatory templates attrbutes
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int post_update_template(std::string& error) override;

    // -------------------------------------------------------------------------
    // Hook Attributes
    // -------------------------------------------------------------------------

    /**
     * The hook type
     */
    HookType type;

    /**
     *  The command to be executed
     */
    std::string   cmd;

    /**
     *  True if the command is to be executed remotely
     */
    bool     remote;

    /**
     * Object which implement type dependent methods.
     */
    HookImplementation * _hook;

    // *************************************************************************
    // Database implementation
    // *************************************************************************

    /**
     *  Construct the XML representation of the hook
     *  @param xml the resulting XML string
     *  @param log to include the execution log
     *
     *  @return a reference to the generated string
     */
    std::string& _to_xml(std::string& xml, bool log) const;

    /**
     *  Bootstraps the database table(s) associated to the Host
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db);

    /**
     *  Writes/updates the Hosts data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db) override
    {
        std::string error_str;
        return insert_replace(db, true, error_str);
    };

    /**
     *  Writes the Hook in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, std::string& error_str) override;

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 one success
     */
    int insert_replace(SqlDB *db, bool replace, std::string& error_str);

    /**
     *  Drops object from the database
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int drop(SqlDB *db) override;
};

#endif /*HOOK_H_*/
