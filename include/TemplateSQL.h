/* ------------------------------------------------------------------------ */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)           */
/*                                                                          */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may  */
/* not use this file except in compliance with the License. You may obtain  */
/* a copy of the License at                                                 */
/*                                                                          */
/* http://www.apache.org/licenses/LICENSE-2.0                               */
/*                                                                          */
/* Unless required by applicable law or agreed to in writing, software      */
/* distributed under the License is distributed on an "AS IS" BASIS,        */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. */
/* See the License for the specific language governing permissions and      */
/* limitations under the License.                                           */
/* ------------------------------------------------------------------------ */

#ifndef TEMPLATE_SQL_H_
#define TEMPLATE_SQL_H_

#include <iostream>
#include <map>
#include <vector>

#include "Template.h"
#include "SqlDB.h"
#include "ObjectSQL.h"

using namespace std;

/**
 *  SQL Template class, it provides DB support for template objects
 */
class TemplateSQL : public Template, public ObjectSQL
{
public:
    TemplateSQL(
        const char * _table,
        int          template_id = -1,
        bool         replace     = false,
        const char   separator   = '=',
        const char * xml_root    = "TEMPLATE"):
            Template(replace,separator,xml_root),table(_table),id(template_id)
    {};

    virtual ~TemplateSQL(){};

protected:

    //Database implementation variables

    const char *        table;

    static const char * db_names;

    //Template attributes

    /**
     *  Template unique identification.
     */
    int id;

    /**
     *  Writes the template in the DB
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
    int insert(SqlDB * db);

    /**
     *  Updates the template in the DB
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
    int update(SqlDB *db);

    /**
     *  Reads the template (identified by its id) from the DB
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
    int select(SqlDB *db);

    /**
     *  Removes the template from the DB
     *    @param db pointer to the database.
     */
    int drop(SqlDB *db);

    /**
     *  Removes a template attribute from the DB. If there are multiple
     *  attributes with the same name, only one will be replaced. The 
     *  attribute MUST be allocated in the heap.
     *    @param db pointer to the database.
     *    @param attribute pointer to the new attribute.
     */
    int replace_attribute(SqlDB * db, Attribute * attribute);

    /**
     *  Insert a given attribute (MUST be allocated in the heap) in the template
     *  and updates the DB.
     *    @param db pointer to the database.
     *    @param attribute pointer to the new attribute
     */
    int insert_attribute(SqlDB * db, Attribute * attribute);

    /**
     *  Callback to set the template id (TemplateSQL::insert)
     */
    int  insert_cb(void *nil, int num, char **values, char **names);

    /**
     *  Callback to recover template attributes (TemplateSQL::select)
     */
    int  select_cb(void *nil, int num, char **values, char **names);
};

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

#endif /*TEMPLATE_SQL_H_*/