/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
#include <set>

#include <ctype.h>
#include <string.h>
#include <fnmatch.h>

#include "expr_bool.h"
#include "ObjectXML.h"

#define YYERROR_VERBOSE
#define expr_bool__lex expr_lex

extern "C"
{
    #include "mem_collector.h"

    void expr_bool__error(
        YYLTYPE *       llocp,
        mem_collector * mc,
        ObjectXML *     oxml,
        bool&           result,
        char **         error_msg,
        const char *    str);

    int expr_bool__lex (YYSTYPE *lvalp, YYLTYPE *llocp, mem_collector * mc);

    int expr_bool__parse(mem_collector * mc,
                         ObjectXML *     oxml,
                         bool&           result,
                         char **         errmsg);

    int expr_bool_parse(ObjectXML *oxml, bool& result, char ** errmsg)
    {
        mem_collector mc;
        int           rc;

        mem_collector_init(&mc);

        rc = expr_bool__parse(&mc,oxml,result,errmsg);

        mem_collector_cleanup(&mc);

        return rc;
    }
}

int get_xml_attribute(ObjectXML * oxml, const char* attr, int& val);

int get_xml_attribute(ObjectXML * oxml, const char* attr, float& val);

int get_xml_attribute(ObjectXML * oxml, const char* attr, string& val);

void get_xml_values(ObjectXML * oxml, const char* attr, vector<string>& results);

void get_vm_ids(ObjectXML * oxml, set<int>& vm_ids);

%}

%parse-param {mem_collector * mc}
%parse-param {ObjectXML *     oxml}
%parse-param {bool&           result}
%parse-param {char **         error_msg}

%lex-param {mem_collector * mc}

%union {
    char * 	val_str;
    int 	val_int;
    float   val_float;
};

%defines
%locations
%pure_parser
%name-prefix = "expr_bool__"
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

expr:   STRING '=' INTEGER { int val, rc;

            if ($1 == string("CURRENT_VMS"))
            {
                set<int> vm_ids;
                get_vm_ids(oxml, vm_ids);

                $$ = vm_ids.count($3) > 0;
            }
            else
            {
                rc = get_xml_attribute(oxml,$1,val);
                $$ = (rc == 0 && val == $3);
            }
          }

        | STRING '!' '=' INTEGER { int val, rc;

            if ($1 == string("CURRENT_VMS"))
            {
                set<int> vm_ids;
                get_vm_ids(oxml, vm_ids);

                $$ = vm_ids.count($4) == 0;
            }
            else
            {
                rc = get_xml_attribute(oxml,$1,val);
                $$ = (rc == 0 && val != $4);
            }
          }

        | STRING '>' INTEGER { int val, rc;

            rc = get_xml_attribute(oxml,$1,val);
            $$ = (rc == 0 && val > $3);}

        | STRING '<' INTEGER { int val, rc;

            rc = get_xml_attribute(oxml,$1,val);
            $$ = (rc == 0 && val < $3);}

        | STRING '=' FLOAT { float val, rc;

            rc = get_xml_attribute(oxml,$1,val);
            $$ = (rc == 0 && val == $3);}

        | STRING '!' '=' FLOAT { float val, rc;

            rc = get_xml_attribute(oxml,$1,val);
            $$ = (rc == 0 && val != $4);}

        | STRING '>' FLOAT { float val, rc;

            rc = get_xml_attribute(oxml,$1,val);
            $$ = (rc == 0 && val > $3);}

        | STRING '<' FLOAT { float val, rc;

            rc = get_xml_attribute(oxml,$1,val);
            $$ = (rc == 0 && val < $3);}

        | STRING '=' STRING { string val; int rc;

            rc = get_xml_attribute(oxml,$1,val);
            $$ = (rc != 0 || $3==0) ? false : fnmatch($3,val.c_str(),0)==0;}

        | STRING '!''=' STRING { string val; int rc;

            rc = get_xml_attribute(oxml,$1,val);
            $$ = (rc != 0 || $4==0) ? false : fnmatch($4,val.c_str(),0)!=0;}

        | expr '&' expr { $$ = $1 && $3; }
        | expr '|' expr { $$ = $1 || $3; }
        | '!' expr      { $$ = ! $2; }
        | '(' expr ')'  { $$ =   $2; }
        ;

%%

extern "C" void expr_bool__error(
    YYLTYPE *       llocp,
    mem_collector * mc,
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

    result = false;
}

void get_xml_values(ObjectXML * oxml, const char* attr, vector<string> &results)
{
    if (attr[0] == '/')
    {
        results = (*oxml)[attr];
    }
    else
    {
        ostringstream  xpath;

        xpath << "/HOST/TEMPLATE/" << attr
            << "|/HOST/HOST_SHARE/" << attr
            << "|/HOST/" << attr
            << "|/HOST/CLUSTER_TEMPLATE/" << attr;

        results = (*oxml)[xpath.str().c_str()];
    }
}

int get_xml_attribute(ObjectXML * oxml, const char* attr, int& val)
{
    val = 0;

    vector<string> results;
    get_xml_values(oxml, attr, results);

    if (results.size() != 0)
    {
        istringstream iss(results[0]);
        iss >> val;

        if (iss.fail())
        {
            val = 0;

            return -1;
        }

        return 0;
    }

    return -1;
}

int get_xml_attribute(ObjectXML * oxml, const char* attr, float& val)
{
    val = 0.0;

    vector<string> results;
    get_xml_values(oxml, attr, results);

    if (results.size() != 0)
    {
        istringstream iss(results[0]);
        iss >> val;

        if (iss.fail())
        {
            val = 0;

            return -1;
        }

        return 0;
    }

    return -1;
}

int get_xml_attribute(ObjectXML * oxml, const char* attr, string& val)
{
    val = "";

    vector<string> results;
    get_xml_values(oxml, attr, results);

    if (results.size() != 0)
    {
        val = results[0];

        return 0;
    }

    return -1;
}

void get_vm_ids(ObjectXML * oxml, set<int>& vm_ids)
{
    istringstream  iss;
    vector<string> results;
    int id;

    get_xml_values(oxml, "/HOST/VMS/ID", results);

    for (vector<string>::iterator it=results.begin(); it!=results.end(); it++)
    {
        iss.clear();
        iss.str(*it);

        iss >> id;

        if (!iss.fail())
        {
            vm_ids.insert(id);
        }
    }
}