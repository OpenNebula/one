#ifndef CACHE_POOL_H_
#define CACHE_POOL_H_

#include <time.h>
#include <sstream>
#include <pthread.h>

#include <iostream>

#include <vector>

using namespace std;

/**
 *  The Cache Pool class.
 */
template<typename T> class CachePool
{
private:

    pthread_mutex_t resource_lock;

    std::map<int, T *> resources;

public:
    CachePool(){
        pthread_mutex_init(&resource_lock,0);
    }

    ~CachePool()
    {
        typename std::map<int, T *>::iterator it;

        for (it=resources.begin(); it != resources.end() ; ++it)
        {
            delete it->second;
        }
    };

    T * get_resource(int oid)
    {
        T * res;

        pthread_mutex_lock(&resource_lock);

        typename std::map<int, T *>::iterator it = resources.find(oid);

        if ( it == resources.end() )
        {
            res = new T;

            resources.insert(std::make_pair(oid, res));
        }
        else
        {
            res = it->second;
        }

        pthread_mutex_unlock(&resource_lock);

        return res;
    }


    void delete_resource(int oid)
    {
        pthread_mutex_lock(&resource_lock);

        typename std::map<int, T *>::iterator it = resources.find(oid);

        if ( it != resources.end() )
        {
            delete it->second;

            resources.erase(it);
        }

        pthread_mutex_unlock(&resource_lock);
    }
};

#endif /*CACHE_POOL_H_*/