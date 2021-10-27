import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import {APOLLO_OPTIONS} from 'apollo-angular';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainComponent } from './main/main.component';
import { GraphQLModule } from './graphql.module';
import {HttpLink} from 'apollo-angular/http';
import {createHttpLink, InMemoryCache} from '@apollo/client/core'
import { HttpClientModule, HttpHeaders } from '@angular/common/http';
import {environment} from '../environments/environment';

const token = environment.gitToken;

const uri = environment.gitUri;

@NgModule({
  declarations: [
    AppComponent,
    MainComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    GraphQLModule,
    HttpClientModule
  ],
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: (httpLink: HttpLink) => {
        const cache = new InMemoryCache();
        return {
          link: httpLink.create({
            uri: uri,
            headers:new HttpHeaders().set('Authorization',`Bearer ${token}` )
          }),
          cache
        };
      },
      deps: [HttpLink],
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
