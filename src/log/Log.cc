/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "Log.h"

#include <string.h>
#include <stdlib.h>
#include <stdexcept>
#include <sstream>
#include <iostream>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char Log::error_names[] ={ 'E', 'W', 'I', 'D' };

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

FileLog::FileLog(const string&   file_name,
                 const MessageType   level,
                 ios_base::openmode  mode)
        :Log(level), log_file(0)
{
    ofstream    file;

    log_file = strdup(file_name.c_str());

    file.open(log_file, mode);

    if (file.fail() == true)
    {
        free(log_file);

        throw runtime_error("Could not open log file");
    }

    if ( file.is_open() == true )
    {
        file.close();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

FileLog::~FileLog()
{
    if ( log_file != 0 )
    {
        free(log_file);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void FileLog::log(
    const char *            module,
    const MessageType       type,
    const char *            message)
{
    char        str[26];
    time_t      the_time;
    ofstream    file;

    if( type <= log_level)
    {
        file.open(log_file, ios_base::app);

        if (file.fail() == true)
        {
            return;
        }

        the_time = time(NULL);

#ifdef SOLARIS
        ctime_r(&(the_time),str,sizeof(char)*26);
#else
        ctime_r(&(the_time),str);
#endif
        // Get rid of final enter character
        str[24] = '\0';

        file << str << " ";
        file << "[" << module << "]";
        file << "[" << error_names[type] << "]: ";
        file << message;
        file << endl;

        file.flush();

        file.close();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void CerrLog::log(
    const char *            module,
    const MessageType       type,
    const char *            message)
{
    char        str[26];
    time_t      the_time;
    ofstream    file;

    if( type <= log_level)
    {
        the_time = time(NULL);

#ifdef SOLARIS
        ctime_r(&(the_time),str,sizeof(char)*26);
#else
        ctime_r(&(the_time),str);
#endif
        // Get rid of final enter character
        str[24] = '\0';

        cerr << str << " ";
        cerr << "[" << module << "]";
        cerr << "[" << error_names[type] << "]: ";
        cerr << message;
        cerr << endl;

        cerr.flush();
    }
}
