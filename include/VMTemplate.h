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
     *  Function to write a VMTemplate on an output stream
     */
    friend ostream& operator<<(ostream& os, VMTemplate& u);

    /**
     * Function to print the VMTemplate object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

    /**
     *  Publish or unpublish an object
     *    @param pub true to publish the object
     *    @return 0 on success
     */
    bool publish(bool pub)
    {
        if (pub == true)
        {
            public_obj = 1;
        }
        else
        {
            public_obj = 0;
        }

        return true;
    };

    // ------------------------------------------------------------------------
    // Template Contents
    // ------------------------------------------------------------------------

    /**
     *  Returns a copy of the VirtualMachineTemplate
     *    @return A copy of the VirtualMachineTemplate
     */
    VirtualMachineTemplate * clone_template() const
    {
        return new VirtualMachineTemplate(
                *(static_cast<VirtualMachineTemplate *>(obj_template)));

        // TODO: Check if there is a more efficient way to do this copy.
        /*string xml_str;
        VirtualMachineTemplate * new_template = new VirtualMachineTemplate();

        obj_template->to_xml(xml_str);
        new_template->from_xml(xml_str);

        return new_template;*/
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
     *    @return 0 one success
     */
    int insert_replace(SqlDB *db, bool replace);

    /**
     *  Bootstraps the database table(s) associated to the VMTemplate
     */
    static void bootstrap(SqlDB * db)
    {
        ostringstream oss(VMTemplate::db_bootstrap);

        db->exec(oss);
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
    VMTemplate(int id, int uid, int gid,
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
        return insert_replace(db, true);
    };
};

#endif /*VMTEMPLATE_H_*/
