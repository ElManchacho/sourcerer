import { Injectable } from '@angular/core';
import {Apollo, gql} from 'apollo-angular';

@Injectable({
  providedIn: 'root'
})
export class GraphqlService {

  constructor(private apollo: Apollo) { }

  getProfileData(userLogin:string){
    return this.apollo
      .watchQuery({
        query: gql`
        {
          user(login: "${userLogin}") {
            name
            company
            location
            avatarUrl
            repositories{
              totalCount
            }
          }
        }               
        `
      });
  }

  getCompanyData(userLogin:string,companyLogin:string){
    return this.apollo
      .watchQuery({
        query: gql`
        {
          user(login: "${userLogin}") {
            organization(login: "${companyLogin}") {
              location
            }
          }
        }               
        `
      });
  }

  getRepositories(userLogin:string,totalRepositories:number)
  {
    return this.apollo
      .watchQuery({
        query: gql`
        {
          user(login: "${userLogin}") {
            repositories(first:${totalRepositories}){
              nodes{
                name
              }
            }
          }
        }               
        `
      });
  }

  getCommits(userLogin:string,reposName:string)
  {
    return this.apollo
      .watchQuery({
        query: gql`
        {
          repository(name: "${reposName}", owner: "${userLogin}") {
            createdAt
            defaultBranchRef {
              target {
                ... on Commit {
                  history(first: 0) {
                    totalCount
                  }
                }
              }
            }
          }
        }               
        `
      });
  }

  getRepository(userLogin:string,reposName:string)
  {
    return this.apollo
      .watchQuery({
        query: gql`
        {
          repository(name: "${reposName}", owner: "${userLogin}") {
            object(expression: "HEAD:") {
              ... on Tree {
                entries {
                  name
                  type
                  object {
                    ... on Blob {
                      byteSize
                      text
                    }
                    ... on Tree {
                      entries {
                        name
                        type
                        
                      }
                    }
                  }
                }
              }
            }
          }
        }               
        `
      });
  }

  getSpecificRepository(userLogin:string,reposName:string,path:string)
  {
    return this.apollo
      .watchQuery({
        query: gql`
        {
          repository(name: "${reposName}", owner: "${userLogin}") {
            object(expression: "HEAD:${path}") {
              ... on Tree {
                entries {
                  name
                  type
                  object {
                    ... on Blob {
                      byteSize
                      text
                    }
                    ... on Tree {
                      entries {
                        name
                        type
                        
                      }
                    }
                  }
                }
              }
            }
          }
        }               
        `
      });
  }
}
