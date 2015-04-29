/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include <sys/types.h>
#include <unistd.h>

#ifdef SYSLOG_LOG
#   include <syslog.h>

#   include "log4cpp/Category.hh"
#   include "log4cpp/CategoryStream.hh"
#   include "log4cpp/Appender.hh"
#   include "log4cpp/SyslogAppender.hh"
#   include "log4cpp/Layout.hh"
#   include "log4cpp/PatternLayout.hh"
#   include "log4cpp/Priority.hh"
#endif /* SYSLOG_LOG */

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char Log::error_names[] ={ 'E', 'W', 'I', 'D', 'D', 'D' };

unsigned int Log::zone_id = 0;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

FileLog::FileLog(const string&   file_name,
                 const MessageType   level,
                 ios_base::openmode  mode)
        :Log(level), log_file_name(file_name)
{
    ofstream file;

    file.open(log_file_name.c_str(), mode);

    if (file.fail() == true)
    {
        throw runtime_error("Could not open log file");
    }

    if ( file.is_open() == true )
    {
        file.close();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

FileLog::~FileLog() { }

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
        file.open(log_file_name.c_str(), ios_base::app);

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
        file << "[Z"<< zone_id<< "]";
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
        cerr << "[Z"<< zone_id<< "]";
        cerr << "[" << module << "]";
        cerr << "[" << error_names[type] << "]: ";
        cerr << message;
        cerr << endl;

        cerr.flush();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#ifdef SYSLOG_LOG

const char * SysLog::CATEGORY = "ROOT";
string       SysLog::LABEL;

/* -------------------------------------------------------------------------- */

SysLog::SysLog(const MessageType level,
               const string&     label):Log(level)
{
    static bool initialized = false;

    if (!initialized) //Initialize just once for all SysLog instances
    {
        ostringstream     oss;
        log4cpp::Appender *appender;

        oss << label << "[" << getpid() << "]";

        LABEL = oss.str();

        appender = new log4cpp::SyslogAppender(CATEGORY, LABEL, LOG_DAEMON);
        appender->setLayout(new log4cpp::PatternLayout());

        log4cpp::Category& root = log4cpp::Category::getRoot();

        root.setPriority(SysLog::get_priority_level(level));
        root.addAppender(appender);

        initialized = true;
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SysLog::log(
    const char *            module,
    const MessageType       type,
    const char *            message)
{
    log4cpp::Category&               root  = log4cpp::Category::getRoot();
    log4cpp::Priority::PriorityLevel level = get_priority_level(type);

    istringstream smessage;
    string        line;

    smessage.str(message);

    while ( getline(smessage, line) )
    {
        root << level << "[Z"<< zone_id<< "]"
                      << "[" << module << "]"
                      << "[" << error_names[type] << "]: "
                      << line;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

log4cpp::Priority::PriorityLevel SysLog::get_priority_level(
    const MessageType level)
{
    log4cpp::Priority::PriorityLevel priority_level;

    switch (level)
    {
    case Log::ERROR:
        priority_level = log4cpp::Priority::ERROR;
        break;

    case Log::WARNING:
        priority_level = log4cpp::Priority::WARN;
        break;

    case Log::INFO:
        priority_level = log4cpp::Priority::INFO;
        break;

    case Log::DEBUG:
    case Log::DDEBUG:
    case Log::DDDEBUG:
        priority_level = log4cpp::Priority::DEBUG;
        break;

    default:
        priority_level = log4cpp::Priority::NOTSET;
        break;
    }

    return priority_level;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * SysLogResource::CATEGORY = "RESOURCE";

/* -------------------------------------------------------------------------- */

SysLogResource::SysLogResource(
        int                             oid,
        const PoolObjectSQL::ObjectType obj_type,
        const MessageType               clevel):SysLog(clevel)
{
    static bool   initialized = false;
    ostringstream oss_label;
    string        obj_type_str;

    if (!initialized)
    {
        log4cpp::Appender *appender;

        appender = new log4cpp::SyslogAppender(CATEGORY,
                                               SysLog::LABEL,
                                               LOG_DAEMON);

        appender->setLayout(new log4cpp::PatternLayout());

        log4cpp::Category& res = log4cpp::Category::getInstance(CATEGORY);

        res.addAppender(appender);
        res.setPriority(SysLog::get_priority_level(clevel));

        initialized = true;
    }

    obj_type_str = PoolObjectSQL::type_to_str(obj_type);

    oss_label << "[" << obj_type_str << " " << oid << "]";
    obj_label = oss_label.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SysLogResource::log(
    const char *            module,
    const MessageType       type,
    const char *            message)
{
    log4cpp::Category& res = log4cpp::Category::getInstance(CATEGORY);
    log4cpp::Priority::PriorityLevel level = get_priority_level(type);

    istringstream   smessage;
    string          line;

    smessage.str(message);

    while ( getline(smessage, line) )
    {
        res << level << obj_label
                     << "[Z" << zone_id << "]"
                     << "[" << module << "]"
                     << "[" << error_names[type] << "]: "
                     << line;
    }
}

#endif  /* SYSLOG_LOG */
