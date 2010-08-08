/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

#include <stdlib.h>
#include <string.h>

#include "mem_collector.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void mem_collector_init(mem_collector * mc)
{
    int i;

    mc->str_buffer = (char **) malloc (sizeof(char*) * MEM_COLLECTOR_CHUNK);
    mc->size       = MEM_COLLECTOR_CHUNK;

    for (i=0; i< mc->size ; i++)
    {
        mc->str_buffer[i] = 0;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void mem_collector_cleanup(mem_collector * mc)
{
    int i;

    for (i=0; i< mc->size ; i++)
    {
        if ( mc->str_buffer[i] != 0 )
        {
            free(mc->str_buffer[i]);
        }
    }

    free(mc->str_buffer);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

char * mem_collector_strdup(mem_collector *mc, const char * str)
{
    int    done = 0;
    int    i, old_size;

    for (i=0; i< mc->size ; i++)
    {
        if ( mc->str_buffer[i] == 0 )
        {
            done = 1;
            break;
        }
    }

    if (done == 0)
    {
        old_size = mc->size;
        mc->size = mc->size + MEM_COLLECTOR_CHUNK;
        mc->str_buffer = (char **) realloc(mc->str_buffer,
                                           sizeof(char*) * mc->size);
        for ( i = old_size ; i < mc->size ; i++)
        {
            mc->str_buffer[i] = 0;
        }

        i = old_size;
    }

    mc->str_buffer[i] = strdup(str);

    return mc->str_buffer[i];
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void mem_collector_free(mem_collector *mc, const char * str)
{
    int    i;

    for (i=0; i< mc->size ; i++)
    {
        if ( mc->str_buffer[i] == str )
        {
            free(mc->str_buffer[i]);
            mc->str_buffer[i] = 0;
            break;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
