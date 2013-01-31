/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include <syslog.h>

#include "log4cpp/Category.hh"
#include "log4cpp/CategoryStream.hh"
#include "log4cpp/Appender.hh"
#include "log4cpp/SyslogAppender.hh"
#include "log4cpp/Layout.hh"
#include "log4cpp/PatternLayout.hh"
#include "log4cpp/Priority.hh"

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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SysLog::init(
    Log::MessageType clevel,
    string name,
    string _label)
{
    ostringstream oss_label;
    string label;

    oss_label << _label << "[" << getpid() << "]";
    label = oss_label.str();

    log4cpp::Appender *syslog_appender;
    syslog_appender = new log4cpp::SyslogAppender(name,label,LOG_DAEMON);
    syslog_appender->setLayout(new log4cpp::PatternLayout());
    log4cpp::Category& root = log4cpp::Category::getRoot();
    root.setPriority(SysLog::get_priority_level(clevel));
    root.addAppender(syslog_appender);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SysLog::log(
    const char *            module,
    const MessageType       type,
    const char *            message)
{
    log4cpp::Category& root = log4cpp::Category::getRoot();

    log4cpp::Priority::PriorityLevel level = get_priority_level(type);

    root << level   << "[" << module << "]"
                    << "[" << error_names[type] << "]: "
                    << message;
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

string SysLogResource::name;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */


void SysLogResource::init(
    Log::MessageType clevel,
    string name,
    string _label)
{
    SysLogResource::name = name;

    ostringstream oss_label;
    string label;

    oss_label << _label << "[" << getpid() << "]";
    label = oss_label.str();

    log4cpp::Appender *resource_appender;
    resource_appender = new log4cpp::SyslogAppender(name,label,LOG_DAEMON);

    resource_appender->setLayout(new log4cpp::PatternLayout());
    log4cpp::Category& res = log4cpp::Category::getInstance(name);
    res.addAppender(resource_appender);
    res.setPriority(SysLog::get_priority_level(clevel));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

SysLogResource::SysLogResource(
    int                             oid,
    const PoolObjectSQL::ObjectType obj_type,
    const MessageType               clevel = WARNING)
    :SysLog(clevel)
{
    ostringstream oss_label;
    string obj_type_str = PoolObjectSQL::type_to_str(obj_type);

    oss_label << "[" << obj_type_str << " " << oid << "]";
    obj_label = oss_label.str();
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SysLogResource::log(
    const char *            module,
    const MessageType       type,
    const char *            message)
{
    log4cpp::Category& res = log4cpp::Category::getInstance(
                                                        SysLogResource::name);

    log4cpp::Priority::PriorityLevel level = get_priority_level(type);

    res << level    << obj_label
                    << "[" << module << "]"
                    << "[" << error_names[type] << "]: "
                    << message;
}
