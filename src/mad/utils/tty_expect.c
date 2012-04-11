/* -------------------------------------------------------------------------- */
/* Copyright 2010-2012, C12G Labs S.L.                                        */ 
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

#ifdef __APPLE__
#include <util.h>
#else
#include <pty.h>
#endif

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <unistd.h>

#include <sys/types.h>
#include <sys/wait.h>

int expect_char(int pty, char * expected, int seconds)
{
    fd_set          rfds;
    struct timeval  tv;

    int  rc;
    char c;

    do
    {
        if (seconds != 0)
        {
            FD_ZERO(&rfds);
            FD_SET(pty, &rfds);

            tv.tv_sec  = seconds;
            tv.tv_usec = 0;

            rc = select(pty+1,&rfds,0,0, &tv);

            if ( rc <= 0 ) // timeout
            {
                return -1;
            }
        }

        rc = read(pty, (void *) &c, sizeof(char));

        if ( rc > 0 )
        {
           if(expected == 0)
	   {
                write(1,&c,sizeof(char));
	   }

            if (expected != 0 && c == *expected)
            {
                return 0;
            }
        }
     }
     while ( rc > 0 );

     return -1;
}

void write_answer(int pty, const char * answer)
{
    int len, i;

    len = strlen(answer);

    for (i=0; i<len; i++)
    {
        write(pty,(void *) &(answer[i]),sizeof(char));
    }

    write(pty,(void *)"\n",sizeof(char));
}

static const char * myexpect_usage =
"\n  myexpect [-h] <-p password> <-u username> <command>\n\n"
"SYNOPSIS\n"
"  Wraps the execution of a command and sends username & password\n\n"
"OPTIONS\n"
"\t-h\tprints this help.\n"
"\t-p\tthe password\n"
"\t-u\tthe username\n"
"\t<virsh command>\tcomplete virsh command\n";

int main (int argc, char **argv)
{
    char * password = 0;
    char * username = 0;

    char expect = ':';

    int opt, pty, pid, rc;
    int times = 1;

    while((opt = getopt(argc,argv,"+hrp:u:")) != -1)
        switch(opt)
        {
            case 'h':
                printf("%s",myexpect_usage);
                exit(0);
                break;
            case 'p':
                password = strdup(optarg);
                break;
            case 'u':
                username = strdup(optarg);
                break;
            case 'r':
                times = 2;
                break;
            default:
                fprintf(stderr,"Wrong option. Check usage\n");
                fprintf(stderr,"%s",myexpect_usage);
                exit(-1);
                break;
        }

    if (password == 0 || username == 0 || optind >= argc )
    {
        fprintf(stderr,"Wrong number of arguments. Check usage\n");
        fprintf(stderr,"%s",myexpect_usage);
        exit(-1);
    }

    pid = forkpty(&pty,0,0,0);

    if(pid == 0)
    {
        struct termios tios;

        tcgetattr(pty, &tios);

        tios.c_lflag &= ~(ECHO | ECHOE | ECHOK | ECHONL);
        tios.c_oflag &= ~(ONLCR);

        tcsetattr(pty, TCSANOW, &tios);

        execvp(argv[optind],&(argv[optind]));

        exit(-1);
    }
    else if (pid == -1)
    {
       perror("fork\n");
    }

    while ( times > 0 )
    {
        expect_char(pty,&expect,1);
        sleep(1);
        write_answer(pty,username);
        expect_char(pty,&expect,1);
        sleep(1);
        write_answer(pty,password);

        times = times - 1;
    }

    expect_char(pty,0,0);

    wait(&rc);

    return WEXITSTATUS(rc);
}
