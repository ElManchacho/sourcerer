import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ObservableArray } from "observable-collection";
import { GraphqlService } from '../service/graphql.service';


type Repository = {name:string; srcList:ObservableArray<string>; filePathList:ObservableArray<any>;};

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

  private getMainFolderSubscription: Subscription | undefined;
  
  private getAllRepositoryFolder: Subscription | undefined;

  private getFilesDataSubscription: Subscription | undefined




  loading = true;
  nom: string = "Not loaded";
  dataUser: any | undefined = { repositories: "null" , following:0,followers:0};
  dataCompany: any | undefined = { organization: "null" };
  userName: string = "Majdi";
  totalCommits: number = 0;
  repositoriesList =  new ObservableArray<Repository>();
  
  pathList = new ObservableArray<string>();

  filePathList =  new ObservableArray<string>();

  fileList = new ObservableArray<any>();

  repositoryList = new ObservableArray<any>();
  
  pathToAdd:string[] = []

  constructor(public service: GraphqlService) { }

  ngOnInit(): void {

    this.pathList.subscribe();

    this.filePathList.subscribe();

    this.fileList.subscribe();

    this.repositoriesList.subscribe();

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

          //console.log(repositoryName)
          if(repositoryName=="deadlands")
          {
            // Sources du repository

            this.pathList = new ObservableArray<any>();

            this.getMainFolderSources(repositoryName)

            this.fileList.subscribe(file => console.log(file))

          }
          
        });
      });
    }
    );
  }

  getFilesData(repositoryName: string, path: string) {
    this.getFilesDataSubscription = this.service.getFileData(this.userName, repositoryName, path).valueChanges.subscribe((file: any) => {
      let currentFile = file.data.repository.object
      let currentFileLines = 0
      if(currentFile.text)
      {
        currentFileLines = currentFile.text.split("\r\n")
      }
      this.fileList.push({pathFile:path,size:currentFile.byteSyze,text:currentFile.text,lines:currentFileLines})
    })
  }

  getMainFolderSources(repositoryName:string){
    this.pathList.push("")
    this.getMainFolderSubscription = this.service.getMainRepositoryFolder(this.userName, repositoryName).valueChanges.subscribe((repository:any) =>{
      let repositoryContent = repository.data.repository.object.entries
      repositoryContent.forEach((content: any) => {
        if(content.type=="tree")
        {
          this.pathList.push(content.path)
        }
        else if(content.type=="blob")
        {
          if (this.filePathList.indexOf(content.path)==-1)
          {
            this.filePathList.push(content.path)
          }
        }
      });
      this.getAllFolderSources(repositoryName)
    });
  }

  getAllFolderSources(repositoryName:string):any {
    this.pathList.forEach(path=>{
      this.getAllRepositoryFolder = this.service.getAllRepositoryFolder(this.userName,repositoryName,path).valueChanges.subscribe((subfolder:any)=>{
        subfolder.data.repository.object.entries.forEach((entry:any) => {
          if(entry.type=="tree")
          {
            if(this.pathList.indexOf(entry.path)==-1)
            {
              this.pathList.push(entry.path)
              this.getAllFolderSources(repositoryName)
            }
            
          }
          else if(entry.type=="blob")
            {
              if (this.filePathList.indexOf(entry.path)==-1)
              {
                this.filePathList.push(entry.path)
                this.getFilesData(repositoryName,entry.path)
              }
            }
        });
      });
    });
    
    
  }


  ngOnDestroy() {

    this.pathList.unsubscribe();

    this.getBioSubscription?.unsubscribe();

    this.getCompanySubscription?.unsubscribe();

    this.getRepositoriesSubscription?.unsubscribe();

    this.getCommitsSubscription?.unsubscribe();

    this.getFilesDataSubscription?.unsubscribe();

    this.getAllRepositoryFolder?.unsubscribe();

    this.getMainFolderSubscription?.unsubscribe();
  }

}
