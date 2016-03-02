/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

#ifndef _LOG_H_
#define _LOG_H_

#include <string>
#include <fstream>
#include <stdexcept>
#include <syslog.h>

#include "PoolObjectSQL.h"

using namespace std;

/**
 *  The Logger class is an interface used by OpenNebula components to log
 *  messages
 */
class Log
{
public:
    enum MessageType {
        ERROR   = 0,
        WARNING = 1,
        INFO    = 2,
        DEBUG   = 3,
        DDEBUG  = 4,
        DDDEBUG = 5
    };

    static const char error_names[];

    Log(const MessageType _level = WARNING):log_level(_level){};

    virtual ~Log(){};

    MessageType get_log_level()
    {
        return log_level;
    }

    static void set_zone_id(int zid)
    {
        zone_id = zid;
    }

    // -------------------------------------------------------------------------
    // Logger interface
    // -------------------------------------------------------------------------

    virtual void log(
        const char *            module,
        const MessageType       type,
        const char *            message) = 0;

protected:
    /**
     *  Minimum log level for the messages
     */
    MessageType log_level;

    /**
     *  Zone ID for log messages, for all Log instances
     * M
     */
    static unsigned int zone_id;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  Log messages to a log file
 */
class FileLog : public Log
{
public:
    FileLog(const string&       file_name,
            const MessageType   level    = WARNING,
            ios_base::openmode  mode     = ios_base::app);

    virtual ~FileLog();

    virtual void log(
        const char *            module,
        const MessageType       type,
        const char *            message);

private:
    string log_file_name;
};

/**
 *  Log messages to a log file
 */
class FileLogTS : public FileLog
{
public:
    FileLogTS(const string&       file_name,
                    const MessageType   level    = WARNING,
                    ios_base::openmode  mode     = ios_base::app)
                       :FileLog(file_name,level,mode)
    {
        pthread_mutex_init(&log_mutex,0);
    }

    ~FileLogTS()
    {
        pthread_mutex_destroy(&log_mutex);
    }

    void log(
        const char *            module,
        const MessageType       type,
        const char *            message)
    {
        pthread_mutex_lock(&log_mutex);
        FileLog::log(module,type,message);
        pthread_mutex_unlock(&log_mutex);
    }

private:
    pthread_mutex_t log_mutex;
};


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 A Send log messages to the standard output stream std::clog
 */
class StdLog : public Log
{
public:
    StdLog(const MessageType level = WARNING):Log(level){};

    ~StdLog(){};

    void log(
        const char *            module,
        const MessageType       type,
        const char *            message);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  Send log messages to syslog
 */
class SysLog : public Log
{
public:
    SysLog(const MessageType level,
           const string&     label);

    SysLog(const MessageType level,
           int oid,
           const PoolObjectSQL::ObjectType obj_type);

    ~SysLog(){};

    void log(
        const char *            module,
        const MessageType       type,
        const char *            message);

    /**
     *  Return the associated syslog level
     */
    inline static int level(const MessageType level)
    {
        switch (level)
        {
            case Log::ERROR:
                return LOG_ERR;
            case Log::WARNING:
                return LOG_WARNING;
            case Log::INFO:
                return LOG_INFO;
            case Log::DEBUG:
            case Log::DDEBUG:
            case Log::DDDEBUG:
                return LOG_DEBUG;
        }

        return LOG_INFO;
    }

private:
    string resource_label;
};

#endif /* _LOG_H_ */
