/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#ifndef DOCUMENT_H_
#define DOCUMENT_H_

#include "PoolObjectSQL.h"
#include "Template.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  The Document class.
 */
class Document : public PoolObjectSQL
{
public:

    /**
     * Function to print the Document object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

    // ------------------------------------------------------------------------
    // Template Contents
    // ------------------------------------------------------------------------

    /**
     *  Factory method for document templates
     */
    Template * get_new_template() const
    {
        return new Template;
    }

    /**
     *  Returns a copy of the Template
     *    @return A copy of the VirtualMachineTemplate
     */
    Template * clone_template() const
    {
        return new Template(
                *(static_cast<Template *>(obj_template)));
    };

    /**
     * Returns the document type
     *
     * @return the document type
     */
    int get_document_type()
    {
        return type;
    };

    /**
     * Tries to get the DB lock. This is a mutex requested by external
     * applications, not related to the internal mutex lock. The object
     * must be locked (internal memory mutex) before this method is called
     *
     * @param owner String to identify who requested the lock
     *
     * @return 0 if the lock was granted, -1 if the object is already locked
     */
    int lock_db(const string& owner)
    {
        return PoolObjectSQL::lock_db(owner);
    };

    /**
     * Unlocks the DB lock for external applications. The object must be locked
     * (internal memory mutex) before this method is called
     *
     * @param owner String to identify who requested the lock
     */
    void unlock_db(const string& owner)
    {
        return PoolObjectSQL::unlock_db(owner);
    };

private:
    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------

    friend class DocumentPool;

    // -------------------------------------------------------------------------
    // Document Attributes
    // -------------------------------------------------------------------------

    /**
     *  Document type, to implement generic objects.
     */
    int         type;

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
     *  Bootstraps the database table(s) associated to the Document
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        ostringstream oss(Document::db_bootstrap);

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
    Document(   int id,
                int uid,
                int gid,
                const string& uname,
                const string& gname,
                int umask,
                int type,
                Template * _template_contents);

    ~Document();

    // *************************************************************************
    // DataBase implementation
    // *************************************************************************

    static const char * db_names;

    static const char * db_bootstrap;

    static const char * table;

    /**
     *  Writes the Document in the database.
     *    @param db pointer to the db
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int insert(SqlDB *db, string& error_str);

    /**
     *  Writes/updates the Document data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db)
    {
        string err;
        return insert_replace(db, true, err);
    };
};

#endif /*DOCUMENT_H_*/
