/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

#include "expr_arith.h"
#include "ObjectXML.h"

#define YYERROR_VERBOSE
#define expr_arith__lex expr_lex

extern "C"
{
    #include "mem_collector.h"

    void expr_arith__error(
        YYLTYPE *       llocp,
        mem_collector * mc,
        ObjectXML *     oxml,
        int&            result,
        char **         error_msg,
        const char *    str);

    int expr_arith__lex (YYSTYPE *lvalp, YYLTYPE *llocp, mem_collector * mc);

    int expr_arith__parse(mem_collector * mc,
                          ObjectXML *     oxml,
                          int&            result,
                          char **         errmsg);

    int expr_arith_parse(ObjectXML *oxml, int& result, char ** errmsg)
    {
        mem_collector mc;
        int           rc;

        mem_collector_init(&mc);

        rc = expr_arith__parse(&mc,oxml,result,errmsg);

        mem_collector_cleanup(&mc);

        return rc;
    }
}

%}

%parse-param {mem_collector * mc}
%parse-param {ObjectXML * oxml}
%parse-param {int&        result}
%parse-param {char **     error_msg}

%lex-param {mem_collector * mc}

%union {
    char *  val_str;
    int     val_int;
    float   val_float;
};

%defines
%locations
%pure_parser
%name-prefix = "expr_arith__"
%output      = "expr_arith.cc"

%left '+' '-'
%left '*' '/'
%token <val_int>    INTEGER
%token <val_str>    STRING
%token <val_float>  FLOAT
%type  <val_int>    stmt
%type  <val_float>  expr

%%

stmt:   expr                { result = static_cast<int>($1);}
        |                   { result = 0; }
        ;

expr:   STRING              { float val; oxml->search($1, val); $$ = val; }
        | FLOAT             { $$ = $1; }
        | INTEGER           { $$ = static_cast<float>($1); }
        | expr '+' expr     { $$ = $1 + $3;}
        | expr '-' expr     { $$ = $1 - $3;}
        | expr '*' expr     { $$ = $1 * $3;}
        | expr '/' expr     { $$ = $1 / $3;}
        | '-' expr          { $$ = - $2;}
        | '(' expr ')'      { $$ = $2;}
        ;

%%

extern "C" void expr_arith__error(
    YYLTYPE *       llocp,
    mem_collector * mc,
    ObjectXML *     oxml,
    int&            result,
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
