#include <iostream>
#include <sstream>
#include <string>

#include <unistd.h> 

#include "MadManager.h"

pthread_cond_t  cond = PTHREAD_COND_INITIALIZER;
pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
bool            finalized = false;

class MadEcho : public Mad
{
public:
    MadEcho(map<string,string> &attrs):Mad(0,attrs,false)
    {}
    ;

    ~MadEcho()
    {}
    ;

    void protocol(string& message);

    void recover()
    {
        cout<<"Recover Function @ MadEcho\n";
    };
    
    void test(const char *a1, const char *a2, const char *a3)
    {
        ostringstream   buf;
        
        buf << "TEST " << a1 << " " << a2 << " " << a3 << "\n";
         
        write(buf);
    }
    
    void first(const char *a1)
    {
        ostringstream   buf;

        buf << "FIRST " << a1 << "\n";

        write(buf);        
    }
};

void MadEcho::protocol(string& message)
{
    stringbuf   sbuf(message);
    iostream    sstr(&sbuf);
    
    string      field[5];
    
    sstr >> field[0] >> ws;
    
    if ( field[0] == "INIT" )
    {
        getline(sstr,field[1]);
        
        cout << "Init Result: " << field[1] << "\n";    
    }
    else if ( field[0] == "FINALIZE" )
    {
        getline(sstr,field[1]);
        
        cout << "Finalize Result: " << field[1] << "\n";
    }
    else if ( field[0] == "TEST" )
    {
        sstr >> field[1] >> field[2] >> field[3] >> ws;
        
        getline(sstr,field[4]);
        
        cout << "Test Result: " << field[1] << "\nArg1: " << field[2] 
             << "\nArg2: " << field[3] << "\nInfo: " << field[4] << "\n";
    }
    else if ( field[0] == "FIRST" )
    {
        finalized = true;
        
        sstr >> field[1] >> ws;
        getline(sstr,field[2]);

        cout << "First Result: " << field[1] << "\nArg1: " << field[2] << "\n"; 
        
        pthread_cond_signal(&cond);
    }
}

class MMadManager : public MadManager
{
public:
    MMadManager(vector<const Attribute *>& _mads):MadManager(_mads){};
    ~MMadManager(){};
    
    void load_mads(int uid){};    
    
    int mstart(){
        return start();
    }

    void mstop(){
        stop();
    }
    
    int madd(Mad *mad){
        return add(mad);
    }    
};

int main()
{
    vector<const Attribute *> _mads;
    MMadManager         *mm;
    MadEcho *           mad_echo;
    map<string,string>  attrs;
    int                 rc;
    
    MadManager::mad_manager_system_init();

    mm = new MMadManager(_mads);
    
    rc = mm->mstart();
    
    if ( rc != 0 )
    {
        goto error_start;
    }
        
    attrs.insert(make_pair("NAME","echo_mad"));
    attrs.insert(make_pair("EXECUTABLE","./mad_echo.sh"));
    attrs.insert(make_pair("OWNER","foo"));
    
    mad_echo = new MadEcho(attrs);
    /*
    rc = mad_echo->start();

    if ( rc != 0 )
    {
        goto error_start_mad;
    }
    */
    rc = mm->madd(mad_echo);
    
    if ( rc != 0 )
    {
        goto error_register;
    }
        
    mad_echo->test("argument1","argument2","argument3");
    
    mad_echo->first("filed1");
    
    pthread_mutex_lock(&mutex);
    
    while ( finalized == false )
    {
        pthread_cond_wait(&cond, &mutex);
    }
    
    printf("Mad_Test - OK\n");
    
    mm->mstop();
    
    delete mm;
    
    return 0;

error_register:
    cout << "Mad_Test - error register mad\n";
    mm->mstop();
    
    delete mm;
    delete mad_echo;
    
    return -1;

error_start:
    cout << "Mad_Test - error start manager\n";
    mm->mstop();
    
    delete mm;
    
    return -1;
}
