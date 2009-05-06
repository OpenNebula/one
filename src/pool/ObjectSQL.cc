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

#include <climits>
#include <sstream>
#include <iostream>

#include "ObjectSQL.h"

#include <errno.h>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C"
{
static int select_column_cb(
    void *          _value,
    int             num,
    char **         values,
    char **         names)
{
    string *        value;
    
    value = static_cast<string *>(_value);
    
    if ( value == 0 || values == 0 || values[0] == 0 )
    {
        return -1;
    }
    
    *value = values[0];
    
    return 0;    
}    
}

/* -------------------------------------------------------------------------- */

int ObjectSQL::select_column(
    SqliteDB *      db,
    const string&   table,
    const string&   column,
    const string&   where,
    string *        value)
{
    ostringstream   os;

    if ( where.empty() == true )
    {
        return -1;
    }

    os << "SELECT " << column << " FROM " << table << " WHERE " << where;         
        
    return db->exec(os, select_column_cb, (void *) value);
}    

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
