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

#ifndef _LOG_H_
#define _LOG_H_

#include <string>
#include <fstream>

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
    char * log_file;
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
 *
 */
class CerrLog : public Log
{
public:
    CerrLog(const MessageType level = WARNING):Log(level){};

    ~CerrLog(){};

    void log(
        const char *            module,
        const MessageType       type,
        const char *            message);
};

#endif /* _LOG_H_ */
