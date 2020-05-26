/* A Bison parser, made by GNU Bison 3.4.1.  */

/* Bison interface for Yacc-like parsers in C

   Copyright (C) 1984, 1989-1990, 2000-2015, 2018-2019 Free Software Foundation,
   Inc.

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>.  */

/* As a special exception, you may create a larger work that contains
   part or all of the Bison parser skeleton and distribute that work
   under terms of your choice, so long as that work isn't itself a
   parser generator using the skeleton or a modified version thereof
   as a parser skeleton.  Alternatively, if you modify or redistribute
   the parser skeleton itself, you may (at your option) remove this
   special exception, which will cause the skeleton and the resulting
   Bison output files to be licensed under the GNU General Public
   License without this special exception.

   This special exception was added by the Free Software Foundation in
   version 2.2 of Bison.  */

/* Undocumented macros, especially those whose name start with YY_,
   are private implementation details.  Do not rely on them.  */

#ifndef YY_TEMPLATE_TEMPLATE_SYNTAX_HH_INCLUDED
# define YY_TEMPLATE_TEMPLATE_SYNTAX_HH_INCLUDED
/* Debug traces.  */
#ifndef YYDEBUG
# define YYDEBUG 0
#endif
#if YYDEBUG
extern int template_debug;
#endif
/* "%code requires" blocks.  */
#line 47 "template_syntax.y"

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

#line 67 "template_syntax.hh"

/* Token type.  */
#ifndef YYTOKENTYPE
# define YYTOKENTYPE
  enum yytokentype
  {
    EQUAL = 258,
    COMMA = 259,
    OBRACKET = 260,
    CBRACKET = 261,
    EQUAL_EMPTY = 262,
    CCDATA = 263,
    STRING = 264,
    VARIABLE = 265
  };
#endif

/* Value type.  */
#if ! defined YYSTYPE && ! defined YYSTYPE_IS_DECLARED
union YYSTYPE
{
#line 74 "template_syntax.y"

    char * val_str;
    void * val_attr;

#line 94 "template_syntax.hh"

};
typedef union YYSTYPE YYSTYPE;
# define YYSTYPE_IS_TRIVIAL 1
# define YYSTYPE_IS_DECLARED 1
#endif

/* Location type.  */
#if ! defined YYLTYPE && ! defined YYLTYPE_IS_DECLARED
typedef struct YYLTYPE YYLTYPE;
struct YYLTYPE
{
  int first_line;
  int first_column;
  int last_line;
  int last_column;
};
# define YYLTYPE_IS_DECLARED 1
# define YYLTYPE_IS_TRIVIAL 1
#endif



int template_parse (mem_collector * mc, Template * tmpl, char ** error_msg, yyscan_t scanner);

#endif /* !YY_TEMPLATE_TEMPLATE_SYNTAX_HH_INCLUDED  */
