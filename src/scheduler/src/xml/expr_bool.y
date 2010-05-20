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

%{
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>

#include <ctype.h>
#include <string.h>
#include <fnmatch.h>

#include "expr_bool.h"
#include "ObjectXML.h"

#define YYERROR_VERBOSE
#define expr_bool_lex expr_lex

extern "C"
{
void expr_bool_error(
    YYLTYPE *       llocp,
    ObjectXML *     oxml,
    bool&           result,
    char **         error_msg,
    const char *    str);

int expr_bool_lex (YYSTYPE *lvalp, YYLTYPE *llocp);

int expr_bool_parse(ObjectXML * oxml, bool& result, char ** errmsg);
}

void get_xml_attribute(ObjectXML * oxml, const char* attr, int& val);

void get_xml_attribute(ObjectXML * oxml, const char* attr, float& val);

void get_xml_attribute(ObjectXML * oxml, const char* attr, string& val);

%}

%parse-param {ObjectXML * oxml}
%parse-param {bool&  result}
%parse-param {char ** error_msg}

%union {
    char * 	val_str;
    int 	val_int;
    float   val_float;
};

%defines
%locations
%pure_parser
%name-prefix = "expr_bool_"
%output      = "expr_bool.cc"

%left '!' '&' '|'
%token <val_int>    INTEGER
%token <val_str>    STRING
%token <val_float>  FLOAT
%type  <val_int>    stmt expr

%%

stmt:   expr    { result=$1;   }
        |       { result=true; } /* TRUE BY DEFAULT, ON EMPTY STRINGS */
        ;

expr:   STRING '=' INTEGER { int val;

            get_xml_attribute(oxml,$1,val);
            $$ = val == $3;

            free($1);}

        | STRING '!' '=' INTEGER { int val;

            get_xml_attribute(oxml,$1,val);
            $$ = val != $4;

            free($1);}

        | STRING '>' INTEGER { int val;

            get_xml_attribute(oxml,$1,val);
            $$ = val > $3;

            free($1);}

        | STRING '<' INTEGER { int val;

            get_xml_attribute(oxml,$1,val);
            $$ = val < $3;

            free($1);}

        | STRING '=' FLOAT { float val;

            get_xml_attribute(oxml,$1,val);
            $$ = val == $3;

            free($1);}

        | STRING '!' '=' FLOAT { float val;

            get_xml_attribute(oxml,$1,val);
            $$ = val != $4;

            free($1);}

        | STRING '>' FLOAT {float val;

            get_xml_attribute(oxml,$1,val);
            $$ = val > $3;

            free($1);}

        | STRING '<' FLOAT {float val;

            get_xml_attribute(oxml,$1,val);
            $$ = val < $3;

            free($1);}

        | STRING '=' STRING { string val;

            get_xml_attribute(oxml,$1,val);
            $$ = val.empty() ? false :fnmatch($3, val.c_str(), 0) == 0;

            free($1);
            free($3);}

        | STRING '!''=' STRING { string val;

            get_xml_attribute(oxml,$1,val);
            $$ = val.empty() ? false : fnmatch($4, val.c_str(), 0) != 0;

            free($1);
            free($4);}

        | expr '&' expr { $$ = $1 && $3; }
        | expr '|' expr { $$ = $1 || $3; }
        | '!' expr      { $$ = ! $2; }
        | '(' expr ')'  { $$ =   $2; }
        ;

%%

extern "C" void expr_bool_error(
    YYLTYPE *       llocp,
    ObjectXML *     oxml,
    bool&           result,
    char **         error_msg,
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
}

void get_xml_attribute(ObjectXML * oxml, const char* attr, int& val)
{
    //TODO: pass xpath base
    ostringstream  xpath_t;
    ostringstream  xpath_s;

    vector<string> results;

    xpath_t << "/HOST/TEMPLATE/" << attr;
    xpath_s << "/HOST/HOST_SHARE/" << attr;

    val = 0;

    results = (*oxml)[xpath_t.str().c_str()];

    if (results.size() == 0)
    {
        results = (*oxml)[xpath_s.str().c_str()];
    }

    if (results.size() != 0)
    {
        istringstream iss(results[0]);
        iss >> val;
    }
}

void get_xml_attribute(ObjectXML * oxml, const char* attr, float& val)
{
    //TODO: pass xpath base
    ostringstream  xpath_t;
    ostringstream  xpath_s;

    vector<string> results;

    xpath_t << "/HOST/TEMPLATE/" << attr;
    xpath_s << "/HOST/HOST_SHARE/" << attr;

    val = 0.0;

    results = (*oxml)[xpath_t.str().c_str()];

    if (results.size() == 0)
    {
        results = (*oxml)[xpath_s.str().c_str()];
    }

    if (results.size() != 0)
    {
        istringstream iss(results[0]);
        iss >> val;
    }
}

void get_xml_attribute(ObjectXML * oxml, const char* attr, string& val)
{
    //TODO: pass xpath base
    ostringstream  xpath_t;
    ostringstream  xpath_s;

    vector<string> results;

    xpath_t << "/HOST/TEMPLATE/" << attr;
    xpath_s << "/HOST/HOST_SHARE/" << attr;

    val = "";

    results = (*oxml)[xpath_t.str().c_str()];

    if (results.size() == 0)
    {
        results = (*oxml)[xpath_s.str().c_str()];
    }

    if (results.size() != 0)
    {
        val = results[0];
    }
}