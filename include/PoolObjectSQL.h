/* -------------------------------------------------------------------------- */
/* Copyright 2002-2008, Distributed Systems Architecture Group, Universidad   */
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

#ifndef POOL_OBJECT_SQL_H_
#define POOL_OBJECT_SQL_H_

#include "SqliteDB.h"
#include "ObjectSQL.h"
#include <pthread.h>

using namespace std;

/**
 * PoolObject class. Provides a SQL backend interface for Pool components. Each 
 * object is identified with and unique OID
 * 
 * Note: The PoolObject provides a synchronization mechanism (mutex). This 
 * implementation assumes that the mutex IS LOCKED when the class destructor
 * is called. 
 */

class PoolObjectSQL : public ObjectSQL
{
public:

	PoolObjectSQL(int id=-1):oid(id)
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
    
protected:
    /**
     *  The object unique ID
     */
    int             oid;

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
