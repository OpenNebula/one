#include "PoolSQL.h"
#include <climits>
#include <iostream>
#include <sstream>
#include <string>

class A : public ObjectSQL
{
public:
    A(int n,string &t):number(n),text(t){oid=n;};
    A(int n,const char *t):number(n),text(t){oid=n;};
    A(int n):number(n){oid=n;};
    A(){};
    ~A(){};

    int     number;
    string  text;

    int insert(sqlite3 *db);
    int select(sqlite3 *db);
    int update(sqlite3 *db){return 0;};
};

int A::insert(sqlite3 *db)
{
    const char *  sql_cmd;
    ostringstream buffer;
    string sql;
    int rc;

    buffer << "INSERT INTO test (numero,texto) VALUES (" <<  oid << ",\"" <<
text << "\")";

    sql     = buffer.str();
    sql_cmd = sql.c_str();
    
    rc = sqlite3_exec(db,
        sql_cmd,
        NULL,
        NULL,
        NULL);
        
    if ( rc != SQLITE_OK )
    {
        cout << "ERROR :  "<<sql_cmd<<"\n";
    }
    
    return 0;
};

extern "C" int select_cb (
    void *                  _this,
    int                     num,
    char **                 values,
    char **                 names)
{
    A *aclass;
    
    aclass = (A *) _this;
    
    cout << "#" << values[1] << "#\n";
    
    aclass->text = values[1];
    
    cout << "-" << aclass->text << "-\n";
    
    return 0;
}

int A::select(sqlite3 *db){
    
    const char *  sql_cmd;
    ostringstream buffer;
    string sql;

    buffer << "SELECT * FROM test WHERE numero=" <<  oid;
    
    
    sql = buffer.str();
    sql_cmd =  sql.c_str();

    sqlite3_exec(db,
        sql_cmd,
        select_cb,
        this,
        NULL);
    
    return 0;
};

class Apool : public PoolSQL
{
public:
    Apool(sqlite3 *db):PoolSQL(db,"test"){};
    ~Apool(){};
private:
    ObjectSQL* create(){ return (new A);};
    
};


/*
int main()
{
    sqlite3 *       db;
    
    sqlite3_open("pool.db", &db);

    sqlite3_exec(db,
        "CREATE TABLE test (numero INTEGER,"
        "texto TEXT)",
        NULL,
        NULL,
        NULL);
        
        
    A *a;
    Apool           apool(db);
    
    
    a = new A(-1,"prueba");
    
    apool.allocate(a);

    a = new A(4,"otro");
    
    apool.allocate(a);
    
    a = new A(8,"otro mas");
    
    apool.allocate(a);
    
    A * aobj = static_cast<A *>(apool.get(1,false));
    
    cout << aobj->text << "\n";
    
    delete aobj;
    
    aobj = static_cast<A *>(apool.get(0,false));
    
    cout << aobj->text << "\n";
    
    delete aobj;
    
    sqlite3_close(db);
}
*/

/*
int main()
{
    sqlite3 *       db;
    string  s("HOLA");
    A test(8,s);
    A otro(8);

    sqlite3_open("pool.db", &db);

    sqlite3_exec(db,
        "CREATE TABLE test (numero INTEGER,"
        "texto TEXT)",
        NULL,
        NULL,
        NULL);

    test.insert(db);
    
    otro.select(db);
    
    cout << "texto : " << otro.text;

    sqlite3_close(db);
}*/
