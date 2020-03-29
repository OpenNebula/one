/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

#include "MySqlDB.h"
#include <mysql/errmsg.h>
#include <mysqld_error.h>

/*********
 * Doc: https://dev.mysql.com/doc/refman/8.0/en/c-api.html
 ********/

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static std::string get_encoding(MYSQL * c, const std::string& sql,
        std::string& error)
{
    std::string encoding;

    if ( mysql_query(c, sql.c_str()) != 0 )
    {
        error = "Could not read database encoding.";
        return "";
    }

    MYSQL_RES * result = mysql_store_result(c);

    if (result == nullptr)
    {
        error = "Could not read database encoding: ";
        error.append(mysql_error(c));

        return "";
    }

    MYSQL_ROW row = mysql_fetch_row(result);

    if ( row == nullptr )
    {
        error = "Could not read databse encoding";
        mysql_free_result(result);
        return "";
    }

    encoding = ((char **) row)[0];

    mysql_free_result(result);

    return encoding;
}

/* -------------------------------------------------------------------------- */

int MySqlDB::db_encoding(std::string& error)
{
    MYSQL * connection = mysql_init(nullptr);

    if ( mysql_real_connect(connection, server.c_str(), user.c_str(),
                password.c_str(), 0, port, NULL, 0) == nullptr)
    {
        error = "Could not open connect to database server: ";
        error.append(mysql_error(connection));

        return -1;
    }

    std::string create_sql = "CREATE DATABASE IF NOT EXISTS " + database;

    if ( mysql_query(connection, create_sql.c_str()) != 0 )
    {
        error = "Could not create the database.";
        return -1;
    }

    if (!encoding.empty())
    {
        mysql_close(connection);

        return 0;
    }

    //Get encodings for database and tables
    std::string db_sql = "SELECT default_character_set_name FROM "
     "information_schema.SCHEMATA WHERE schema_name = \"" + database + "\"";

    std::string db_enc = get_encoding(connection, db_sql, error);

    if ( db_enc.empty() )
    {
        return -1;
    }

    std::string table_sql = "SELECT CCSA.character_set_name FROM "
     "information_schema.`TABLES` T, information_schema.`COLLATION_CHARACTER_SET_APPLICABILITY`"
     " CCSA WHERE CCSA.collation_name = T.table_collation AND T.table_schema = "
     "\"" + database + "\" AND T.table_name = \"system_attributes\"";

    std::string table_enc = get_encoding(connection, table_sql, error);

    if ( !table_enc.empty() && table_enc != db_enc)
    {
        error = "Database and table charsets (" + db_enc + ", " + table_enc
            + ") differs";
        return -1;
    }

    encoding = db_enc;

    mysql_close(connection);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

MySqlDB::MySqlDB(const string& s, int p, const string& u, const string& _p,
    const string& d, const string& e, int m):max_connections(m), server(s),
     port(p), user(u), password(_p), database(d), encoding(e)
{
    vector<MYSQL *> connections(max_connections);
    MYSQL * rc;

    ostringstream oss;
    std::string   error;

    // Initialize the MySQL library
    mysql_library_init(0, NULL, NULL);

    if ( db_encoding(error) == -1 )
    {
        throw runtime_error(error);
    }

    // Create connection pool to the server
    for (int i=0 ; i < max_connections ; i++)
    {
        connections[i] = mysql_init(NULL);

        rc = mysql_real_connect(connections[i], server.c_str(), user.c_str(),
                password.c_str(), 0, port, NULL, 0);

        if ( rc == nullptr)
        {
            std::string error = "Could not open connect to database server: ";
            error.append(mysql_error(connections[i]));

            throw runtime_error(error);
        }
    }

    db_escape_connect = mysql_init(NULL);

    rc = mysql_real_connect(db_escape_connect, server.c_str(), user.c_str(),
            password.c_str(), 0, port, NULL, 0);

    if ( rc == nullptr)
    {
        std::string error = "Could not open connect to database server: ";
        error.append(mysql_error(db_escape_connect));

        throw runtime_error(error);
    }

    if ( mysql_set_character_set(db_escape_connect, encoding.c_str()) != 0 )
    {
        std::string error = "Could not set encoding : ";
        error.append(mysql_error(db_escape_connect));

        throw runtime_error(error);
    }

    std::string use_sql = "USE " + database;

    for (int i=0 ; i < max_connections ; i++)
    {
        if ( mysql_query(connections[i], use_sql.c_str()) != 0 )
        {
            std::string error = "Could not connect to database: ";
            error.append(mysql_error(connections[i]));

            throw runtime_error(error);
        }

        if ( mysql_set_character_set(connections[i], encoding.c_str()) != 0 )
        {
            std::string error = "Could not set encoding : ";
            error.append(mysql_error(connections[i]));

            throw runtime_error(error);
        }

        db_connect.push(connections[i]);
    }

    oss << "Set up " << max_connections << " DB connections using encoding " <<
        encoding;

    NebulaLog::log("ONE", Log::INFO, oss);

    pthread_mutex_init(&mutex,0);

    pthread_cond_init(&cond,0);
}

/* -------------------------------------------------------------------------- */

MySqlDB::~MySqlDB()
{
    // Close the connections to the MySQL server
    while (!db_connect.empty())
    {
        MYSQL * db = db_connect.front();
        db_connect.pop();

        mysql_close(db);
    }

    mysql_close(db_escape_connect);

    // End use of the MySQL library
    mysql_library_end();

    pthread_mutex_destroy(&mutex);

    pthread_cond_destroy(&cond);
}

/* -------------------------------------------------------------------------- */

bool MySqlDB::multiple_values_support()
{
    return true;
}

/* -------------------------------------------------------------------------- */

bool MySqlDB::limit_support()
{
    return true;
}

/* -------------------------------------------------------------------------- */

int MySqlDB::exec_ext(std::ostringstream& cmd, Callbackable *obj, bool quiet)
{
    string str         = cmd.str();
    const char * c_str = str.c_str();

    int ec = SqlDB::SUCCESS;

    Log::MessageType error_level = quiet ? Log::DDEBUG : Log::ERROR;

    struct timespec timer;

    Log::start_timer(&timer);

    MYSQL * db = get_db_connection();

    int rc = mysql_query(db, c_str);

    if (rc != 0)
    {
        ostringstream oss;

        const char * err_msg = mysql_error(db);
        int          err_num = mysql_errno(db);

        switch(err_num)
        {
            case CR_SERVER_GONE_ERROR:
            case CR_SERVER_LOST:
                oss << "MySQL connection error " << err_num << " : " << err_msg;

                // Try to re-connect
                if (mysql_real_connect(db, server.c_str(), user.c_str(),
                        password.c_str(), database.c_str(), port, NULL, 0))
                {
                    oss << "... Reconnected.";
                }
                else
                {
                    oss << "... Reconnection attempt failed.";
                }

                ec = SqlDB::CONNECTION;
                break;

            // Error codes that should be considered applied for the RAFT log.
            case ER_DUP_ENTRY:
                ec = SqlDB::SQL_DUP_KEY;
                break;

            default:
                ec = SqlDB::SQL; //Default exit code for errors
                break;
        }

        if (ec != SqlError::CONNECTION)
        {
            oss << "SQL command was: " << c_str;
            oss << ", error " << err_num << " : " << err_msg;
        }

        NebulaLog::log("ONE", error_level, oss);

        free_db_connection(db);

        return ec;
    }

    if (obj != 0)
    {
        // Retrieve the entire result set all at once
        MYSQL_RES * result = mysql_store_result(db);

        int num_rows = mysql_affected_rows(db);

        if ( obj->isCallBackSet() )
        {
            MYSQL_ROW           row;
            MYSQL_FIELD *       fields;
            unsigned int        num_fields;

            if (result == NULL)
            {
                ostringstream   oss;
                const char *    err_msg = mysql_error(db);
                int             err_num = mysql_errno(db);

                oss << "SQL command was: " << c_str;
                oss << ", error " << err_num << " : " << err_msg;

                NebulaLog::log("ONE",error_level,oss);

                free_db_connection(db);

                return SqlDB::SQL;
            }

            // Fetch the names of the fields
            num_fields = mysql_num_fields(result);
            fields     = mysql_fetch_fields(result);

            char ** names = new char*[num_fields];

            for(unsigned int i = 0; i < num_fields; i++)
            {
                names[i] = fields[i].name;
            }

            // Fetch each row, and call-back the object waiting for them
            while((row = mysql_fetch_row(result)))
            {
                if ( obj->do_callback(num_fields, row, names) != 0 )
                {
                    ec = SqlDB::SQL;
                    break;
                }
            }

            delete[] names;
        }

        if ( obj->get_affected_rows() == 0 && num_rows > 0)
        {
            obj->set_affected_rows(num_rows);
        }

        // Free the result object
        mysql_free_result(result);
    }

    free_db_connection(db);

    double sec = Log::stop_timer(&timer);

    if ( sec > 0.5 )
    {
        std::ostringstream oss;

        oss << "Slow query (" << one_util::float_to_str(sec) << "s) detected: "
            << str;

        NebulaLog::log("SQL", Log::WARNING, oss);
    }

    return ec;
}

/* -------------------------------------------------------------------------- */

char * MySqlDB::escape_str(const string& str)
{
    char * result = new char[str.size()*2+1];

    mysql_real_escape_string(db_escape_connect, result, str.c_str(), str.size());

    return result;
}

/* -------------------------------------------------------------------------- */

void MySqlDB::free_str(char * str)
{
    delete[] str;
}

/* -------------------------------------------------------------------------- */

MYSQL * MySqlDB::get_db_connection()
{
    MYSQL *db;

    pthread_mutex_lock(&mutex);

    while ( db_connect.empty() == true )
    {
        pthread_cond_wait(&cond, &mutex);
    }

    db = db_connect.front();

    db_connect.pop();

    pthread_mutex_unlock(&mutex);

    return db;
}

/* -------------------------------------------------------------------------- */

void MySqlDB::free_db_connection(MYSQL * db)
{
    pthread_mutex_lock(&mutex);

    db_connect.push(db);

    pthread_cond_signal(&cond);

    pthread_mutex_unlock(&mutex);
}

/* -------------------------------------------------------------------------- */

bool MySqlDB::fts_available()
{
    unsigned long version;

    version = mysql_get_server_version(db_escape_connect);

    if (version >= 50600)
    {
        return true;
    }
    else
    {
        return false;
    }
}

/* -------------------------------------------------------------------------- */
