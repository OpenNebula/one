/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

#ifndef POOL_OBJECT_SQL_H_
#define POOL_OBJECT_SQL_H_

#include "ObjectSQL.h"
#include "ObjectXML.h"
#include <pthread.h>
#include <string.h>

using namespace std;

/**
 * PoolObject class. Provides a SQL backend interface for Pool components. Each
 * object is identified with and unique OID
 *
 * Note: The PoolObject provides a synchronization mechanism (mutex). This
 * implementation assumes that the mutex IS LOCKED when the class destructor
 * is called.
 */

class PoolObjectSQL : public ObjectSQL, public ObjectXML
{
public:

    PoolObjectSQL(int id=-1):oid(id),valid(true)
    {
        pthread_mutex_init(&mutex,0);
    };

    virtual ~PoolObjectSQL()
    {
        pthread_mutex_unlock(&mutex);

        pthread_mutex_destroy(&mutex);
    };

    int get_oid() const
    {
        return oid;
    };

    /**
     *  Check if the object is valid
     *    @return true if object is valid
     */
    const bool& isValid() const
    {
       return valid;
    };

    /**
     *  Set the object valid flag
     *  @param _valid new valid flag
     */
    void set_valid(const bool _valid)
    {
        valid = _valid;
    };

    /**
     *  Function to lock the object
     */
    void lock()
    {
        pthread_mutex_lock(&mutex);
    };

    /**
     *  Function to unlock the object
     */
    void unlock()
    {
        pthread_mutex_unlock(&mutex);
    };

    /**
     * Function to print the object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
//    virtual string& to_xml(string& xml) const = 0;
//  TODO: change to pure virtual when all child classes implement it
    string& to_xml(string& xml) const
    {
        return xml;
    };

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
//    virtual int from_xml(const string &xml_str) = 0;
//  TODO: change to pure virtual when all child classes implement it
    virtual int from_xml(const string &xml_str)
    {
        return 0;
    };

protected:

    /**
     *  Callback function to unmarshall a PoolObjectSQL
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    int select_cb(void *nil, int num, char **values, char **names)
    {
        if ( (!values[0]) || (num != 1) )
        {
            return -1;
        }

        from_xml( values[0] );
        return 0;
    };

    /**
     *  Reads the PoolObjectSQL (identified by its OID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    virtual int select(SqlDB *db)
    {
        ostringstream   oss;
        int             rc;
        int             boid;

        set_callback(
                static_cast<Callbackable::Callback>(&PoolObjectSQL::select_cb));

        oss << "SELECT body FROM " << table_name() << " WHERE oid = " << oid;

        boid = oid;
        oid  = -1;

        rc = db->exec(oss, this);

        unset_callback();

        if ((rc != 0) || (oid != boid ))
        {
            return -1;
        }

        return 0;
    };

    /**
     *  Drops object from the database
     *    @param db pointer to the db
     *    @return 0 on success
     */
    virtual int drop(SqlDB *db)
    {
        ostringstream oss;
        int rc;

        oss << "DELETE FROM " << table_name() << " WHERE oid=" << oid;

        rc = db->exec(oss);

        if ( rc == 0 )
        {
            set_valid(false);
        }

        return rc;
    };

    /**
     *  Function to output a pool object into a stream in XML format
     *    @param oss the output stream
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    static int dump(ostringstream& oss, int num, char **values, char **names)
    {
        if ( (!values[0]) || (num != 1) )
        {
            return -1;
        }

        oss << values[0];
        return 0;
    };

    /**
     *  The object's unique ID
     */
    int  oid;

    /**
     *  The contents of this object are valid
     */
    bool valid;

    /**
     *  Table name
     *    @return the object's table name
     */
//    virtual const char * table_name() = 0;
//  TODO: change to pure virtual when all child classes implement it
    virtual const char * table_name()
    {
        return "";
    };

private:

    /**
     *  The PoolSQL, friend to easily manipulate its Objects
     */
    friend class PoolSQL;

    /**
     * The mutex for the PoolObject. This implementation assumes that the mutex
     * IS LOCKED when the class destructor is called.
     */
    pthread_mutex_t mutex;
};

#endif /*POOL_OBJECT_SQL_H_*/
