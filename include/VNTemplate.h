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

#ifndef VNTEMPLATE_H_
#define VNTEMPLATE_H_

#include "PoolObjectSQL.h"
#include "VirtualNetworkTemplate.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  The VNTemplate class.
 */
class VNTemplate : public PoolObjectSQL
{
public:

    virtual ~VNTemplate() = default;

    /**
     * Function to print the VNTemplate object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml) const override;

    // ------------------------------------------------------------------------
    // Template Contents
    // ------------------------------------------------------------------------

    /**
     *  Factory method for virtual machine templates
     */
    std::unique_ptr<Template> get_new_template() const override
    {
        return std::make_unique<VirtualNetworkTemplate>();
    }

    /**
     *  Returns a copy of the VirtualNetworkTemplate
     *    @return A copy of the VirtualNetworkTemplate
     */
    std::unique_ptr<VirtualNetworkTemplate> clone_template() const
    {
        return std::make_unique<VirtualNetworkTemplate>(*obj_template);
    }

private:
    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------

    friend class VNTemplatePool;

    // -------------------------------------------------------------------------
    // VNTemplate Attributes
    // -------------------------------------------------------------------------

    /**
     *  Registration time
     */
    time_t      regtime;

    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 one success
     */
    int insert_replace(SqlDB *db, bool replace, std::string& error_str);

    /**
     *  Bootstraps the database table(s) associated to the VNTemplate
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db);

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const std::string &xml_str) override;

protected:

    // *************************************************************************
    // Constructor
    // *************************************************************************
    VNTemplate(int id,
               int uid,
               int gid,
               const std::string& uname,
               const std::string& gname,
               int umask,
               std::unique_ptr<VirtualNetworkTemplate> _template_contents);

    // *************************************************************************
    // DataBase implementation
    // *************************************************************************

    /**
     *  Writes the VNTemplate in the database.
     *    @param db pointer to the db
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int insert(SqlDB *db, std::string& error_str) override;

    /**
     *  Writes/updates the VNTemplate data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db) override
    {
        std::string err;
        return insert_replace(db, true, err);
    };
};

#endif /*VNTEMPLATE_H_*/
