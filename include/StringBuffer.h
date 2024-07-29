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

#ifndef STRING_BUFFER_H
#define STRING_BUFFER_H

#include <stdlib.h>
#include <unistd.h>
#include <string.h>

#include <string>

#define STRING_BUFFER_SIZE 256

class StringBuffer
{
public:
    StringBuffer()
    {
        buffer = (char *) malloc(STRING_BUFFER_SIZE * sizeof(char));
        buffer_seek = buffer;

        memset(static_cast<void *>(buffer), 0, STRING_BUFFER_SIZE);
    }

    ~StringBuffer()
    {
        free(buffer);
    }

    int read_line(int fd, std::string& line)
    {
        /* Look for pending lines in the buffer */
        const char * eom = strchr(buffer_seek, '\n');

        if ( eom != 0 )
        {
            line.assign(buffer_seek, (eom - buffer_seek) + 1);

            line_sz -= (eom - buffer_seek) + 1;

            buffer_seek = (char *) eom + 1;

            return 0;
        }

        /* Rotate buffer */

        for ( size_t i = 0 ; i < line_sz; i++)
        {
            buffer[i] = buffer_seek[i];
        }

        char * cur_ptr = buffer + line_sz;

        /* Read from stream */
        do
        {
            int rc = ::read(fd, (void *) cur_ptr, cur_sz - line_sz - 1);

            if ( rc <= 0 )
            {
                return -1;
            }

            cur_ptr[rc] = '\0';

            line_sz += rc;

            eom = strchr(cur_ptr, '\n');

            if ( eom == 0)
            {
                cur_sz += STRING_BUFFER_SIZE;

                auto new_buffer = (char *) realloc((void *) buffer, cur_sz * sizeof(char));

                if (!new_buffer)
                {
                    // Out of memory
                    return -1;
                }

                buffer = new_buffer;
                cur_ptr = buffer + line_sz;

                continue;
            }

            line.assign(buffer, (eom - buffer) + 1);

            buffer_seek = (char *) eom + 1;

            line_sz -= (eom - buffer) + 1;

            return 0;
        } while (true);
    }

private:
    char * buffer;
    char * buffer_seek;

    size_t cur_sz  = STRING_BUFFER_SIZE;
    size_t line_sz = 0;
};

#endif /*STREAM_MANAGER_H*/
