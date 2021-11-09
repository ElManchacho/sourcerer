import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { GraphqlService } from '../service/graphql.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
})


export class MainComponent implements OnInit, OnDestroy {

  private getBioSubscription: Subscription | undefined;

  private getCompanySubscription: Subscription | undefined;

  private getRepositoriesSubscription: Subscription | undefined;

  private getCommitsSubscription: Subscription | undefined;

  private getSpecificRepositorySubscription: Subscription | undefined;

  private getFolderSubscription: Subscription | undefined;




  loading = true;
  nom: string = "Not loaded";
  dataUser: any | undefined = { repositories: "null" , following:0,followers:0};
  dataCompany: any | undefined = { organization: "null" };
  userName: string = "Majdi";
  totalCommits: number = 0;
  repositoriesList: [any?] = []
  currentRepositoryToExplore: any
  fileList:any[]=[]
  pathList:string[] = []
  pathToAdd:string[] = []

  constructor(public service: GraphqlService) { }

  ngOnInit(): void {

    // Info relatives au compte

    this.getBioSubscription = this.service.getProfileData(this.userName).valueChanges.subscribe(result => {
      this.dataUser = result.data;
      this.dataUser = this.dataUser.user;
      if (this.dataUser.company) {
        this.getCompanySubscription = this.service.getCompanyData(this.userName, this.dataUser.company).valueChanges.subscribe(resultCompany => {
          this.dataCompany = resultCompany.data;
          this.dataCompany = this.dataCompany.user;
        });
      }

      // Noms des repository

      let repositories: any | undefined;
      this.getRepositoriesSubscription = this.service.getRepositories(this.userName, this.dataUser.repositories.totalCount).valueChanges.subscribe(resultRepositories => {
        repositories = resultRepositories.data;
        repositories = repositories.user.repositories.nodes;
        repositories.forEach((repository: any) => {

          // Total de commits par repository

          var commits: any | undefined;
          this.getCommitsSubscription = this.service.getCommits(this.userName, repository.name).valueChanges.subscribe(numberCommits => {
            commits = numberCommits.data;
            commits = commits.repository.defaultBranchRef.target.history
            this.totalCommits += commits.totalCount
          });

          let repositoryName = repository.name

          // Sources du repository

          this.getFolderSubscription = this.service.getRepository(this.userName, repositoryName).valueChanges.subscribe(repository =>{
            this.pathList = []
            this.fileList = []
            this.getAllFolderSources(repository.data,repositoryName)
            console.log(this.repositoriesList)
          });
          
        });
      });
    }
    );
  }

  getAllFolderSources(folder: any, repositoryName:string):any {
    folder.repository.object.entries.forEach((entry: any) => {
      if(entry.type=="tree")
      {
        this.pathList.push(entry.path)
      }
      else if(entry.type==="blob")
      {
        this.fileList.push(entry)
      }
    });
    this.pathList.forEach(path=>{
      this.getSpecificRepositorySubscription = this.service.getSpecificRepository(this.userName,repositoryName,path).valueChanges.subscribe((subfolder:any)=>{
        subfolder.data.repository.object.entries.forEach((entry:any) => {
          if(entry.type=="tree")
          {
            this.pathList.push(entry.path)
          }
          else if(entry.type==="blob")
          {
            this.fileList.push(entry)
          }
        });
      })
    })
    // Erreur dans l'affectation des src
    this.repositoriesList.push({name:repositoryName, srcList:this.pathList, fileList:this.fileList})
    
  }


  ngOnDestroy() {
    this.getBioSubscription?.unsubscribe();

    this.getCompanySubscription?.unsubscribe();

    this.getRepositoriesSubscription?.unsubscribe();

    this.getCommitsSubscription?.unsubscribe();

    this.getSpecificRepositorySubscription?.unsubscribe();

    this.getFolderSubscription?.unsubscribe();
  }

}
