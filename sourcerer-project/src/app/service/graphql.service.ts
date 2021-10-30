import { Injectable } from '@angular/core';
import {Apollo, gql} from 'apollo-angular';

@Injectable({
  providedIn: 'root'
})
export class GraphqlService {

  constructor(private apollo: Apollo) { }

  getProfileData(){
    return this.apollo
      .watchQuery({
        query: gql`
        {
          user(login: "Majdi") {
            id
            bio
            login
            avatarUrl
            name
            projectsUrl
          }
        }               
        `
      });
  }
}
