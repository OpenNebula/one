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

#ifndef DOCUMENT_POOL_H_
#define DOCUMENT_POOL_H_

#include "PoolSQL.h"
#include "Document.h"
#include "OneDB.h"

/**
 *  The Document Pool class.
 */
class DocumentPool : public PoolSQL
{
public:

    DocumentPool(SqlDB * db, const std::vector<const SingleAttribute *>& ea) :
        PoolSQL(db, one_db::doc_table)
    {
        DocumentTemplate::parse_encrypted(ea);
    };

    ~DocumentPool() {};

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
                 const std::string&       uname,
                 const std::string&       gname,
                 int                      umask,
                 int                      type,
                 std::unique_ptr<Template> template_contents,
                 int *                    oid,
                 std::string&             error_str)
    {
        *oid = PoolSQL::allocate(
                       new Document(-1, uid, gid, uname, gname, umask, type,
                                    std::move(template_contents)),
                       error_str);

        return *oid;
    }

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database). The object is locked, other threads can't access the same
     *  object. The lock is released by destructor.
     *   @param oid the Document unique identifier
     *   @return a pointer to the Document, nullptr in case of failure
     */
    std::unique_ptr<Document> get(int oid)
    {
        return PoolSQL::get<Document>(oid);
    }

    /**
     *  Gets a read only object from the pool (if needed the object is loaded from the
     *  database). No object lock, other threads may work with the same object.
     *   @param oid the Document unique identifier
     *   @return a pointer to the Document, nullptr in case of failure
     */
    std::unique_ptr<Document> get_ro(int oid)
    {
        return PoolSQL::get_ro<Document>(oid);
    }

    /**
     *  Dumps the pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param sid first element used for pagination
     *  @param eid last element used for pagination, -1 to disable
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    int dump(std::string& oss, const std::string& where, int sid, int eid,
             bool desc) override
    {
        return PoolSQL::dump(oss, "DOCUMENT_POOL", "body", one_db::doc_table,
                             where, sid, eid, desc);
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
    PoolObjectSQL * create() override
    {
        return new Document(-1, -1, -1, "", "", 0, 0, 0);
    };
};

#endif /*DOCUMENT_POOL_H_*/
