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

#ifndef VMTEMPLATE_H_
#define VMTEMPLATE_H_

#include "PoolObjectSQL.h"
#include "VirtualMachineTemplate.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  The VMTemplate class.
 */
class VMTemplate : public PoolObjectSQL
{
public:

    /**
     * Function to print the VMTemplate object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

    // ------------------------------------------------------------------------
    // Template Contents
    // ------------------------------------------------------------------------

    /**
     *  Factory method for virtual machine templates
     */
    Template * get_new_template() const
    {
        return new VirtualMachineTemplate;
    }

    /**
     *  Returns a copy of the VirtualMachineTemplate
     *    @return A copy of the VirtualMachineTemplate
     */
    VirtualMachineTemplate * clone_template() const
    {
        return new VirtualMachineTemplate(
                *(static_cast<VirtualMachineTemplate *>(obj_template)));
    };

private:
    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------

    friend class VMTemplatePool;

    // -------------------------------------------------------------------------
    // VMTemplate Attributes
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
    int insert_replace(SqlDB *db, bool replace, string& error_str);

    /**
     *  Bootstraps the database table(s) associated to the VMTemplate
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        ostringstream oss(VMTemplate::db_bootstrap);

        return db->exec(oss);
    };

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const string &xml_str);

protected:

    // *************************************************************************
    // Constructor
    // *************************************************************************
    VMTemplate(int id, 
               int uid, 
               int gid,
               const string& uname,
               const string& gname,
               VirtualMachineTemplate * _template_contents);

    ~VMTemplate();

    // *************************************************************************
    // DataBase implementation
    // *************************************************************************

    static const char * db_names;

    static const char * db_bootstrap;

    static const char * table;

    /**
     *  Writes the VMTemplate in the database.
     *    @param db pointer to the db
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int insert(SqlDB *db, string& error_str);

    /**
     *  Writes/updates the VMTemplate data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db)
    {
        string err;
        return insert_replace(db, true, err);
    };
};

#endif /*VMTEMPLATE_H_*/
