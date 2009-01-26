/* -------------------------------------------------------------------------- */
/* Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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

#ifndef TEMPLATE_SQL_H_
#define TEMPLATE_SQL_H_

#include <iostream>
#include <map>
#include <vector>

#include "Template.h"
#include "SqliteDB.h"
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
        const char   separator   = '='):
        	Template(replace,separator),table(_table),id(template_id)
    {};

    virtual ~TemplateSQL(){};
    
protected:

    //Database implementation variables
	
	const char *		table;

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
    int insert(SqliteDB * db);
    
    /**
     *  Updates the template in the DB
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
    int update(SqliteDB *db);

    /**
     *  Reads the template (identified by its id) from the DB
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
    int select(SqliteDB *db);

    /**
     *  Removes the template from the DB
     *    @param db pointer to the database.
     */
    int drop(SqliteDB *db);

    /**
     *  Removes a template attribute from the DB (ONLY SINGLE ATTRIBUTES)
     *    @param db pointer to the database.
     *    @param name of the attribute.
     *    @param value of the new attribute. 
     */
    int replace_attribute(SqliteDB * db, const string& name, const string& value); 
    
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*TEMPLATE_SQL_H_*/
