import {NgModule} from '@angular/core';
import {APOLLO_OPTIONS} from 'apollo-angular';
import {ApolloClientOptions, ApolloLink, createHttpLink, InMemoryCache} from '@apollo/client/core';
import {HttpLink} from 'apollo-angular/http';
import { setContext } from '@apollo/client/link/context'
import { HttpClientModule, HttpHeaders } from '@angular/common/http';
import {environment} from '../environments/environment';

const token = environment.gitToken;

const uri = environment.gitUri;

export function createApollo(httpLink: HttpLink): ApolloClientOptions<any> {

  const cache = new InMemoryCache();

  return {
    link : createHttpLink({
      uri:token,
      headers:new HttpHeaders().set('Authorization',`Bearer ${uri}` )
    }),
    cache
  }
}

@NgModule({
  exports: [
    HttpClientModule,
  ],
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink],
    },
  ],
})
export class GraphQLModule {}
