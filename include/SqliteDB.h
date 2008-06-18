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

#ifndef SQLITE_DB_H_
#define SQLITE_DB_H_

#include <string>
#include <sstream>
#include <stdexcept>
#include <sqlite3.h>

#include <sys/time.h>
#include <sys/types.h>
#include <unistd.h>

#include "Log.h"

using namespace std;

/**
 * SqliteDB class. Provides a wrapper to the sqlite3 database interface. It also
 * provides "global" synchronization mechanism to use it in a multithread 
 * environment.
 */
class SqliteDB
{
public:
        
    SqliteDB(
        string&          db_name,
        Log::LogFunction _log  = 0
        ):log(_log)
    {
        int rc;
                
        pthread_mutex_init(&mutex,0);
        
        rc = sqlite3_open(db_name.c_str(), &db);
        
        if ( rc != SQLITE_OK )
        {
            throw runtime_error("Could not open database.");
        }        
    };
    
    ~SqliteDB()
    {
        pthread_mutex_destroy(&mutex);
        
        sqlite3_close(db);
    };
    
    /**
     *  Wraps the sqlite3_exec function call, and locks the DB mutex.
     *    @param sql_cmd the SQL command
     *    @param callbak function to execute on each data returned, watch the
     *    mutex you block in the callback.
     *    @param arg to pass to the callback function
     *    @return 0 on success
     */ 
    int exec(
        ostringstream& sql_cmd,
        int (*callback)(void*,int,char**,char**)=0,
        void *  arg=0)
    {
        int          rc;
        
        const char * c_str;
        string       str;
        
        int          counter = 0;
        
        char *       err_msg;
        char **      ptr = (log==0) ? 0 : &err_msg;
        
        str   = sql_cmd.str();
        c_str = str.c_str();
        
        lock();

        do
        {
            counter++;
            
            rc = sqlite3_exec(db, c_str, callback, arg, ptr);
                     
            if (rc == SQLITE_BUSY || rc == SQLITE_IOERR_BLOCKED)
            {
                struct timeval timeout;
                fd_set zero;
                
                FD_ZERO(&zero);
                timeout.tv_sec  = 0;
                timeout.tv_usec = 100000;
                
                select(0, &zero, &zero, &zero, &timeout);   
            }
            
        }while( (rc == SQLITE_BUSY || rc == SQLITE_IOERR_BLOCKED) && 
                (counter < 10));
                        
        unlock();
        
        if (rc != SQLITE_OK)
        {        
            if ((log != 0) && (err_msg != 0))
            {
                ostringstream oss;
                
                oss << "SQL command was: " << c_str << ", error: " << err_msg;
                log("ONE",Log::ERROR,oss,0,Log::ERROR);
                
                sqlite3_free(err_msg);   
            }
        
            return -1;
        }
           
        return 0;
    };
    
    /**
     * 
     */
    int exec(
        const char * sql_c_str,
        int (*callback)(void*,int,char**,char**)=0,
        void *  arg=0)
    {
        string          sql_str = sql_c_str;
        ostringstream   sql_cmd;
        
        sql_cmd.str(sql_str);
        
        return exec(sql_cmd,callback,arg);
    };
        
private:
    /**
     *  Fine-grain mutex for DB access
     */
    pthread_mutex_t     mutex;

    /**
     *  Pointer to the database.
     */
    sqlite3 *           db;

    /**
     *  Log facility
     */    
    Log::LogFunction    log;
    
    /**
     *  Function to lock the DB
     */
    void lock()
    {
        pthread_mutex_lock(&mutex);
    };

    /**
     *  Function to unlock the DB
     */
    void unlock()
    {
        pthread_mutex_unlock(&mutex);
    };        
};

#endif /*SQLITE_DB_H_*/
