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

#ifndef _LOG_H_
#define _LOG_H_

#include <string>
#include <fstream>

using namespace std;

class Log
{
public:
    enum MessageType {
        ERROR   = 0,
        WARNING = 1,
        INFO    = 2,
        DEBUG   = 3
    };

    typedef void (*LogFunction)(
        const char *,
        const MessageType,
        const ostringstream&,
        const char *,
        const MessageType);
    
    Log(const string&       file_name,
        const MessageType   level = WARNING,
        ios_base::openmode  mode = ios_base::app);

    ~Log();
    
    void log(
        const char *            module,
        const MessageType       type,
        const ostringstream&    message);

    void log(
        const char *            module,
        const MessageType       type,
        const char *            message);
        
private:

    static const char error_names[];
    
    MessageType       log_level;
    
    char *            log_file;
};

#endif /* _LOG_H_ */
