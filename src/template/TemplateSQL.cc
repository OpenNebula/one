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
/* -------------------------------------------------------------------------*/

#include "TemplateSQL.h"
#include <iostream>
#include <sstream>

/* ************************************************************************ */
/* SQL Template                                                             */
/* ************************************************************************ */

const char * TemplateSQL::db_names = "(id,name,type,value)";

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int TemplateSQL::insert_cb(void *nil, int num, char **values, char **names)
{
    if ( num<=0 )
    {
        return -1;
    }

    if ( values[0] == 0 )
    {
        id = 0;
    }
    else
    {
        id = atoi(values[0]) + 1;
    }

    return 0;
}

/* ------------------------------------------------------------------------ */

int TemplateSQL::insert(SqlDB * db)
{
    ostringstream   oss;
    int             rc;

    // Get next id from the DB table
    set_callback(
           static_cast<Callbackable::Callback>(&TemplateSQL::insert_cb));

    oss << "SELECT MAX(id) FROM " << table;

    rc = db->exec(oss,this);

    if ( rc != 0 )
    {
        return -1;
    }

    rc = update(db);

    return rc;
}

/* -------------------------------------------------------------------------- */

int TemplateSQL::update(SqlDB * db)
{
    multimap<string,Attribute *>::iterator  it;
    ostringstream                           oss;
    int                                     rc;
    string *                                attr;
    char *                                  sql_attr;
    Attribute::AttributeType                atype;

    for(it=attributes.begin(),oss.str("");it!=attributes.end();it++,oss.str(""))
    {
        if ( it->second == 0 )
        {
            continue;
        }

        attr  = it->second->marshall();
        atype = it->second->type();

        if ( attr == 0 )
        {
            continue;
        }

        sql_attr = db->escape_str((*attr).c_str());

        delete attr;

        if ( sql_attr == 0 )
        {
            continue;
        }

        oss << "INSERT OR REPLACE INTO " << table << " " << db_names
            << " VALUES (" << id << ",'" << it->first << "',"<< atype <<",'"
            << sql_attr << "')";

        rc = db->exec(oss);

        db->free_str(sql_attr);

        if ( rc != 0 )
        {
            goto error_sql;
        }
    }

    return 0;

error_sql:
    drop(db);

    return -1;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int TemplateSQL::select_cb(void *nil, int num, char **values, char **names)
{
    Attribute *         attr;

    string              name;
    string              value;
    int                 atype;

    if (num != 4)
    {
        return -1;
    }

    if ( values[1] != 0 )
    {
        name  = values[1];
    }
    else
    {
        return -1;
    }

    if ( values[3] != 0 )
    {
        value = values[3];
    }
    else
    {
        return -1;
    }

    if ( values[2] != 0 )
    {
        atype = atoi(values[2]);

        switch (atype)
        {
        case Attribute::SIMPLE:
            attr = new SingleAttribute(name);
            break;

        case Attribute::VECTOR:
            attr = new VectorAttribute(name);
            break;

        default:
            return -1;
            break;
        };
    }

    attr->unmarshall(value);

    set(attr);

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int TemplateSQL::select(SqlDB * db)
{
    ostringstream   oss;
    int             rc;

    if ( id == -1 )
    {
        return -1;
    }

    set_callback(static_cast<Callbackable::Callback>(&TemplateSQL::select_cb));

    oss << "SELECT * FROM " << table << " WHERE id=" << id;

    rc = db->exec(oss,this);

    return rc;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int TemplateSQL::drop(SqlDB * db)
{
    ostringstream   oss;

    if ( id == -1 )
    {
        return -1;
    }

    oss << "DELETE FROM " << table << " WHERE id=" << id;

    return db->exec(oss);
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int TemplateSQL::replace_attribute(SqlDB * db, Attribute * attribute)
{
    ostringstream   oss;
    int             rc;
    string *        astr;
    char *          sql_attr;

    multimap<string, Attribute *>::iterator i;

    if ( id == -1 || attribute == 0)
    {
        return -1;
    }

    i = attributes.find(attribute->name());

    if ( i != attributes.end() )
    {
        astr = i->second->marshall();

        if ( astr == 0 )
        {
            return -1;
        }

        sql_attr = db->escape_str((*astr).c_str());

        delete astr;

        if ( sql_attr == 0 )
        {
            return -1;
        }

        oss << "DELETE FROM " << table << " WHERE id=" << id
            << " AND name='" << attribute->name() << "' AND value='"
            << sql_attr << "'";

        rc = db->exec(oss);

        db->free_str(sql_attr);

        if (rc != 0 )
        {
            return rc;
        }

        delete i->second;

        attributes.erase(i);
    }

    return insert_attribute(db,attribute);
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int TemplateSQL::insert_attribute(SqlDB * db, Attribute * attribute)
{
    ostringstream   oss;
    int             rc;
    string *        astr;
    int             atype;

    char *          sql_attr;

    if ( id == -1 || attribute == 0)
    {
        return -1;
    }

    astr  = attribute->marshall();
    atype = attribute->type();

    if ( astr == 0 )
    {
        return -1;
    }

    sql_attr = db->escape_str((*astr).c_str());

    delete astr;

    if ( sql_attr == 0 )
    {
        return -1;
    }

    oss << "INSERT INTO " << table << " " << db_names
        << " VALUES (" << id << ",'" << attribute->name() << "'," << atype
        << ",'" << sql_attr << "')";

    rc = db->exec(oss);

    db->free_str(sql_attr);

    if (rc == 0)
    {
        attributes.insert(make_pair(attribute->name(),attribute));
    }

    return rc;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */
