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

#ifndef _NEBULA_LOG_H_
#define _NEBULA_LOG_H_

#include "Log.h"

#include <sstream>

#ifdef SYSLOG_LOG
#   include <syslog.h>
#endif /* SYSLOG_LOG */

using namespace std;

/**
 *  The Logger class for the OpenNebula components
 */
class NebulaLog
{
public:
    enum LogType {
        FILE       = 0,
        FILE_TS    = 1,
        CERR       = 2,
        SYSLOG     = 3,
        UNDEFINED  = 4
    };

    // ---------------------------------------------------------------
    // Logging
    // ---------------------------------------------------------------

    static void init_log_system(
        LogType             ltype,
        Log::MessageType    clevel,
        const char *        filename,
        ios_base::openmode  mode,
        const string&       daemon)
    {
        switch(ltype)
        {
            case FILE:
                NebulaLog::logger = new FileLog(filename,clevel,mode);
                break;
            case FILE_TS:
                NebulaLog::logger = new FileLogTS(filename,clevel,mode);
                break;
            case SYSLOG:
                NebulaLog::logger = new SysLog(clevel, daemon);
                break;
            default:
                NebulaLog::logger = new CerrLog(clevel);
                break;
        }
    };

    static LogType str_to_type(string& type)
    {
        transform(type.begin(), type.end(), type.begin(), (int(*)(int))toupper);

        if (type == "FILE")
        {
            return FILE_TS;
        }
        else if (type == "SYSLOG")
        {
            return SYSLOG;
        }
        else if (type == "STDERR")
        {
            return CERR;
        }

        return UNDEFINED;
    }

    static void finalize_log_system()
    {
        delete logger;
    }

    static void log(
        const char *           module,
        const Log::MessageType type,
        const char *           message)
    {
        logger->log(module,type,message);
    };

    static void log(
        const char *           module,
        const Log::MessageType type,
        const ostringstream&   message)
    {
        logger->log(module,type,message.str().c_str());
    };

    static void log(
        const char *           module,
        const Log::MessageType type,
        const string&          message)
    {
        logger->log(module,type,message.c_str());
    };

    static Log::MessageType log_level()
    {
        return logger->get_log_level();
    };

private:
    NebulaLog(){};
    ~NebulaLog(){};

    static Log * logger;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /* _NEBULA_LOG_H_ */
