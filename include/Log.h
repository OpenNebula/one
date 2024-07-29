/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

/**
 *  The Logger class is an interface used by OpenNebula components to log
 *  messages
 */
class Log
{
public:
    enum MessageType
    {
        ERROR   = 0,
        WARNING = 1,
        INFO    = 2,
        DEBUG   = 3,
        DDEBUG  = 4,
        DDDEBUG = 5
    };

    static const std::string error_names[];

    Log(const MessageType _level = WARNING):log_level(_level) {};

    virtual ~Log() {};

    MessageType get_log_level() const
    {
        return log_level;
    }

    static void set_zone_id(int zid)
    {
        zone_id = zid;
    }

    // -------------------------------------------------------------------------
    // Profiler Interface
    // -------------------------------------------------------------------------
    static void start_timer(struct timespec * estart)
    {
        clock_gettime(CLOCK_MONOTONIC, estart);
    }

    static double stop_timer(struct timespec * estart)
    {
        double sec;

        struct timespec eend;

        clock_gettime(CLOCK_MONOTONIC, &eend);

        sec = (eend.tv_sec + (eend.tv_nsec * 1e-9)) - (estart->tv_sec +
                                                       (estart->tv_nsec * 1e-9));

        return sec;
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
    FileLog(const std::string&      file_name,
            const MessageType       level    = WARNING,
            std::ios_base::openmode mode     = std::ios_base::app);

    virtual ~FileLog();

    void log(
            const char *            module,
            const MessageType       type,
            const char *            message) override;

private:
    std::string log_file_name;
};

/**
 *  Log messages to a log file
 */
class FileLogTS : public FileLog
{
public:
    FileLogTS(const std::string&       file_name,
              const MessageType        level    = WARNING,
              std::ios_base::openmode  mode     = std::ios_base::app)
        :FileLog(file_name, level, mode)
    {
    }

    ~FileLogTS() = default;

    void log(
            const char *            module,
            const MessageType       type,
            const char *            message) override
    {
        std::lock_guard <std::mutex> lock(log_mutex);
        FileLog::log(module, type, message);
    }

private:
    std::mutex log_mutex;
};


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 A Send log messages to the standard output stream std::clog
 */
class StdLog : public Log
{
public:
    StdLog(const MessageType level):Log(level) {};

    StdLog(const MessageType level,
           int oid,
           const PoolObjectSQL::ObjectType obj_type);

    ~StdLog() {};

    void log(
            const char *            module,
            const MessageType       type,
            const char *            message) override;

private:
    std::string resource_label;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  Send log messages to syslog
 */
class SysLog : public Log
{
public:
    SysLog(const MessageType  level,
           const std::string& label);

    SysLog(const MessageType level,
           int oid,
           const PoolObjectSQL::ObjectType obj_type);

    ~SysLog() {};

    void log(
            const char *            module,
            const MessageType       type,
            const char *            message) override;

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
    std::string resource_label;
};

#endif /* _LOG_H_ */
