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
#include "template_syntax.h"
#include "template_parser.h"
#include "NebulaUtil.h"

#define YYERROR_VERBOSE

void template_error( YYLTYPE * llocp, mem_collector * mc, Template * tmpl,
    char ** error_msg, yyscan_t scanner, const char * str);

int template_lex (YYSTYPE *lvalp, YYLTYPE *llocp, mem_collector * mc,
    yyscan_t scanner);

int template_parse(Template * tmpl, char ** errmsg, yyscan_t scanner)
{
    mem_collector mc;
    int           rc;

    mem_collector_init(&mc);

    rc = template_parse(&mc, tmpl, errmsg, scanner);

    mem_collector_cleanup(&mc);

    return rc;
}

static string& unescape (string &str);
%}

%code requires {
#include <iostream>
#include <string>
#include <map>
#include <algorithm>

#include <ctype.h>
#include <string.h>
#include <stdio.h>

#include "mem_collector.h"

#include "Template.h"

typedef void * yyscan_t;

int template_parse(Template * tmpl, char ** errmsg, yyscan_t scanner);
}

%parse-param {mem_collector * mc}
%parse-param {Template * tmpl}
%parse-param {char ** error_msg}
%parse-param {yyscan_t scanner}

%lex-param {mem_collector * mc}
%lex-param {yyscan_t scanner}

%union {
    char * val_str;
    void * val_attr;
};

%defines
%locations
%pure-parser
%name-prefix "template_"
%output      "template_syntax.cc"

%token EQUAL COMMA OBRACKET CBRACKET EQUAL_EMPTY CCDATA
%token <val_str>    STRING
%token <val_str>    VARIABLE
%type  <val_attr>   array_val
%type  <void>       attribute
%type  <void>       template

%%

template_file :
    | template
    ;

template: attribute
    | template attribute
    ;

attribute:  VARIABLE EQUAL STRING
            {
                Attribute * pattr;
                string      name($1);
                string      value($3);

                pattr = new SingleAttribute(name,unescape(value));

                tmpl->set(pattr);
            }
         |  VARIABLE EQUAL OBRACKET array_val CBRACKET
            {
                Attribute * pattr;
                string      name($1);
                map<string,string> * amap;

                amap    = static_cast<map<string,string> *>($4);
                pattr   = new VectorAttribute(name,*amap);

                tmpl->set(pattr);

                delete amap;
            }
         |  VARIABLE EQUAL OBRACKET CBRACKET
            {
                Attribute * pattr;
                string      name($1);

                pattr   = new VectorAttribute(name);

                tmpl->set(pattr);
            }
         |  VARIABLE EQUAL_EMPTY
            {
                Attribute * pattr;
                string      name($1);
                string      value;

                pattr = new SingleAttribute(name,value);

                tmpl->set(pattr);
            }
         | VARIABLE EQUAL CCDATA
            {
                YYABORT;
            }
        ;

array_val:  VARIABLE EQUAL STRING
            {
                map<string,string>* vattr;
                string              name($1);
                string              value($3);

                one_util::toupper(name);

                vattr = new map<string,string>;
                vattr->insert(make_pair(name,unescape(value)));

                $$ = static_cast<void *>(vattr);
            }
        |   array_val COMMA VARIABLE EQUAL STRING
            {
                string               name($3);
                string               value($5);
                map<string,string> * attrmap;

                one_util::toupper(name);

                attrmap = static_cast<map<string,string> *>($1);

                attrmap->insert(make_pair(name,unescape(value)));
                $$ = $1;
            }
        ;
%%

string& unescape (string &str)
{
    size_t  pos = 0;

    while ((pos = str.find("\\\"", pos)) != string::npos)
    {
        str.replace(pos,2,"\"");
    }

    return str;
}

void template_error(
    YYLTYPE *       llocp,
    mem_collector * mc,
    Template *      tmpl,
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
}
