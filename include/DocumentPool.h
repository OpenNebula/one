/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

#ifndef DOCUMENT_POOL_H_
#define DOCUMENT_POOL_H_

#include "PoolSQL.h"
#include "Document.h"

/**
 *  The Document Pool class.
 */
class DocumentPool : public PoolSQL
{
public:

    DocumentPool(SqlDB * db) : PoolSQL(db, Document::table){};

    ~DocumentPool(){};

    /**
     *  Allocates a new object, writing it in the pool database. No memory is
     *  allocated for the object.
     *    @param uid user id (the owner of the Document)
     *    @param gid the id of the group this object is assigned to
     *    @param uname name of the owner user
     *    @param gname name of the group
     *    @param umask permissions umask
     *    @param type for the new Document
     *    @param template_contents a Template object
     *    @param oid the id assigned to the Document
     *    @param error_str Returns the error reason, if any
     *
     *    @return the oid assigned to the object, -1 in case of failure
     */
    int allocate(int                      uid,
                 int                      gid,
                 const string&            uname,
                 const string&            gname,
                 int                      umask,
                 int                      type,
                 Template *               template_contents,
                 int *                    oid,
                 string&                  error_str)
    {
        *oid = PoolSQL::allocate(
            new Document(-1, uid, gid, uname, gname, umask, type, template_contents),
            error_str);

        return *oid;
    }

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database).
     *   @param oid the object unique identifier
     *   @param lock locks the object if true
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    Document * get(int oid, bool lock)
    {
        return static_cast<Document *>(PoolSQL::get(oid,lock));
    };

    /**
     *  Dumps the pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param limit parameters used for pagination
     *
     *  @return 0 on success
     */
    int dump(ostringstream& oss, const string& where, const string& limit)
    {
        return PoolSQL::dump(oss, "DOCUMENT_POOL", Document::table, where,
                             limit);
    };

    /**
     *  Bootstraps the database table(s) associated to the pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB *_db)
    {
        return Document::bootstrap(_db);
    };

private:
    /**
     *  Factory method to produce Image objects
     *    @return a pointer to the new Image
     */
    PoolObjectSQL * create()
    {
        return new Document(-1,-1,-1,"","",0,0,0);
    };
};

#endif /*DOCUMENT_POOL_H_*/
