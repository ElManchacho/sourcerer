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
            following {
              totalCount
            }
            followers {
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
                description
                isPrivate
                owner {
                  login
                }
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

  getMainRepositoryFolder(userLogin:string,reposName:string)
  {
    return this.apollo
      .watchQuery({
        query: gql`
        {
          repository(owner: "${userLogin}", name: "${reposName}") {
            object(expression: "HEAD:") {
              ... on Tree {
                entries {
                  name
                  type
                  
                  path
                }
              }
            }
          }
        }            
        `
      });
  }

  getFileData(userLogin:string,reposName:string,path:string):any
  {
    return this.apollo
    .watchQuery({
      query: gql`
      {
        repository(owner: "${userLogin}", name: "${reposName}") {
          object(expression: "HEAD:${path}") {
            ... on Blob {
              text
              byteSize
            }
          }
        }
      }             
      `
    });
  }

  getAllRepositoryFolder(userLogin:string,reposName:string,path:string):any
  {
    return this.apollo
    .watchQuery({
      query: gql`
      {
        repository(owner: "${userLogin}", name: "${reposName}") {
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
                      path
                      object {
                        ... on Blob {
                          byteSize
                        }
                      }
                    }
                  }
                }
                path
              }
            }
          }
        }
      }             
      `
    });
  }
}
