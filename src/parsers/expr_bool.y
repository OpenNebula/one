/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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


%{
#include "expr_bool.h"
#include "expr_parser.h"

#define YYERROR_VERBOSE
#define expr_bool_lex expr_lex

void expr_bool_error(YYLTYPE * llocp, mem_collector * mc, ObjectXML * oxml,
    bool& result, char ** error_msg, yyscan_t scanner, const char * str);

int expr_bool_lex (YYSTYPE *lvalp, YYLTYPE *llocp, mem_collector * mc,
    yyscan_t scanner);

int expr_bool_parse(ObjectXML *oxml, bool& result, char ** errmsg,
    yyscan_t scanner)
{
    mem_collector mc;
    int           rc;

    mem_collector_init(&mc);

    rc = expr_bool_parse(&mc, oxml, result, errmsg, scanner);

    mem_collector_cleanup(&mc);

    return rc;
}

%}

%code requires {
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
#include <set>

#include <ctype.h>
#include <string.h>
#include <fnmatch.h>

#include "mem_collector.h"

#include "ObjectXML.h"

typedef void * yyscan_t;

int expr_bool_parse(ObjectXML *oxml, bool& result, char ** errmsg,
    yyscan_t scanner);
}

%parse-param {mem_collector * mc}
%parse-param {ObjectXML * oxml}
%parse-param {bool& result}
%parse-param {char ** error_msg}
%parse-param {yyscan_t scanner}

%lex-param {mem_collector * mc}
%lex-param {yyscan_t scanner}

%union {
    char *  val_str;
    int     val_int;
    float   val_float;
};

%defines
%locations
%pure-parser
%name-prefix "expr_bool_"
%output      "expr_bool.cc"

%left '!' '&' '|'
%token <val_int>    INTEGER
%token <val_str>    STRING
%token <val_float>  FLOAT
%type  <val_int>    stmt expr

%%

stmt:   expr    { result=$1;   }
        |       { result=true; } /* TRUE BY DEFAULT, ON EMPTY STRINGS */
        ;

expr:   STRING '=' INTEGER {
            int val = $3;
            int rc;

            rc = oxml->search($1,val);

            $$ = (rc == 0 && val == $3);
        }

        | STRING '!' '=' INTEGER {
            int val = $4;
            int rc;

            rc = oxml->search($1,val);

            $$ = (rc == 0 && val != $4);
        }

        | STRING '>' INTEGER {
            int val, rc;

            rc = oxml->search($1,val);
            $$ = (rc == 0 && val > $3);
        }

        | STRING '<' INTEGER {
            int val, rc;

            rc = oxml->search($1,val);
            $$ = (rc == 0 && val < $3);
        }

        | STRING '@''>' INTEGER {
            std::vector<int> val;
            std::vector<int>::iterator it;

            $$ = false;

            oxml->search($1,val);

            for (it=val.begin(); it != val.end(); ++it)
            {
                if ($4 == *it)
                {
                    $$ = true;
                    break;
                }
            }
        }

        | STRING '=' FLOAT {
            float val, rc;

            rc = oxml->search($1,val);
            $$ = (rc == 0 && val == $3);
        }

        | STRING '!' '=' FLOAT {
            float val, rc;

            rc = oxml->search($1,val);
            $$ = (rc == 0 && val != $4);
        }

        | STRING '>' FLOAT {
            float val, rc;

            rc = oxml->search($1,val);
            $$ = (rc == 0 && val > $3);
        }

        | STRING '<' FLOAT {
            float val, rc;

            rc = oxml->search($1,val);
            $$ = (rc == 0 && val < $3);
        }

        | STRING '@''>' FLOAT {
            std::vector<float> val;
            std::vector<float>::iterator it;

            $$ = false;

            oxml->search($1,val);

            for (it=val.begin(); it != val.end(); ++it)
            {
                if ($4 == *it)
                {
                    $$ = true;
                    break;
                }
            }
        }

        | STRING '=' STRING {
            std::string val;
            int rc;

            rc = oxml->search($1,val);
            $$ = (rc != 0 || $3==0) ? false : fnmatch($3,val.c_str(),0)==0;
        }

        | STRING '!''=' STRING {
            std::string val;
            int rc;

            rc = oxml->search($1,val);
            $$ = (rc != 0 || $4==0) ? false : fnmatch($4,val.c_str(),0)!=0;
        }

        | STRING '@''>' STRING {
            std::vector<std::string> val;
            std::vector<std::string>::iterator it;

            $$ = false;

            if ( $4 != 0 )
            {
                oxml->search($1,val);

                for (it=val.begin(); it != val.end(); ++it)
                {
                    if ( fnmatch($4, (*it).c_str(), 0) == 0 )
                    {
                        $$ = true;
                        break;
                    }
                }
            }
        }

        | expr '&' expr { $$ = $1 && $3; }
        | expr '|' expr { $$ = $1 || $3; }
        | '!' expr      { $$ = ! $2; }
        | '(' expr ')'  { $$ =   $2; }
        ;

%%

void expr_bool_error(
    YYLTYPE *       llocp,
    mem_collector * mc,
    ObjectXML *     oxml,
    bool&           result,
    char **         error_msg,
    yyscan_t        scanner,
    const char *    str)
{
    int length;

    length = strlen(str)+ 64;

    *error_msg = (char *) malloc(sizeof(char)*length);

    if (*error_msg != 0)
    {
      snprintf(*error_msg,
            length,
            "%s at line %i, columns %i:%i",
            str,
            llocp->first_line,
            llocp->first_column,
            llocp->last_column);
    }

    result = false;
}
