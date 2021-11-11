import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ObservableArray } from "observable-collection";
import { GraphqlService } from '../service/graphql.service';


type Repository = {name:string; srcList:ObservableArray<string>; fileList:ObservableArray<any>;};

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
  repositoryDenomination : string = "Not loaded"
  lines:number=0
  
  repositoresNameList = new ObservableArray<string>();

  repositoriesList =  new ObservableArray<Repository>();

  constructor(public service: GraphqlService) { }

  ngOnInit(): void {

    this.repositoriesList.subscribe();

    this.repositoresNameList.subscribe();

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

          const repositoryName = repository.name

          this.repositoresNameList.push(repositoryName)

               
          
        });

        //console.log(repositoryName)
          // Sources du repository    
          this.repositoresNameList.forEach(reposName => {

            const pathList = new ObservableArray<string>();

            const filePathList =  new ObservableArray<string>();

            const fileList = new ObservableArray<any>();

            pathList.subscribe();
      
            filePathList.subscribe();
      
            fileList.subscribe();
      
            // Sources du repository
      
            this.repositoryDenomination = reposName
      
            //this.pathList = new ObservableArray<any>();
      
            this.getMainFolderSources(reposName,pathList,filePathList,fileList)
      
            this.repositoriesList.push({name:reposName, srcList:filePathList, fileList:fileList})
      
          }) 
      });
    });

    this.repositoriesList.subscribe(repository=>{
      console.log(repository)
    })
  }

  

  getFilesData(repositoryName: string, path: string, fileList:ObservableArray<any>) {
    this.getFilesDataSubscription = this.service.getFileData(this.userName, repositoryName, path).valueChanges.subscribe((file: any) => {
      let currentFile = file.data.repository.object
      let currentFileLines = 0
      if(currentFile.text)
      {
        currentFileLines = currentFile.text.split("\r\n").length
        this.lines+=currentFileLines
      }
      let nameFile = path.split("/")
      fileList.push({name:nameFile[nameFile.length-1],pathFile:path,size:currentFile.byteSyze,text:currentFile.text,lines:currentFileLines})
    })
  }

  getMainFolderSources(repositoryName:string,pathList:ObservableArray<string>,filePathList:ObservableArray<string>,fileList:ObservableArray<any>){
    pathList.push("")
    this.getMainFolderSubscription = this.service.getMainRepositoryFolder(this.userName, repositoryName).valueChanges.subscribe((repository:any) =>{
      let repositoryContent = repository.data.repository.object.entries
      repositoryContent.forEach((content: any) => {
        if(content.type=="tree")
        {
          pathList.push(content.path)
        }
        else if(content.type=="blob")
        {
          if (filePathList.indexOf(content.path)==-1)
          {
            filePathList.push(content.path)
          }
        }
      });
      this.getAllFolderSources(repositoryName,pathList,filePathList,fileList)
    });
  }

  getAllFolderSources(repositoryName:string,pathList:ObservableArray<string>,filePathList:ObservableArray<string>,fileList:ObservableArray<Repository>):any {
    pathList.forEach(path=>{
      this.getAllRepositoryFolder = this.service.getAllRepositoryFolder(this.userName,repositoryName,path).valueChanges.subscribe((subfolder:any)=>{
        subfolder.data.repository.object.entries.forEach((entry:any) => {
          if(entry.type=="tree")
          {
            if(pathList.indexOf(entry.path)==-1)
            {
              pathList.push(entry.path)
              this.getAllFolderSources(repositoryName,pathList,filePathList,fileList)
            }
            
          }
          else if(entry.type=="blob")
            {
              if (filePathList.indexOf(entry.path)==-1)
              {
                filePathList.push(entry.path)
                this.getFilesData(repositoryName,entry.path,fileList)
              }
            }
        });
      });
    });
    
    
  }


  ngOnDestroy() {

    this.getBioSubscription?.unsubscribe();

    this.getCompanySubscription?.unsubscribe();

    this.getRepositoriesSubscription?.unsubscribe();

    this.getCommitsSubscription?.unsubscribe();

    this.getFilesDataSubscription?.unsubscribe();

    this.getAllRepositoryFolder?.unsubscribe();

    this.getMainFolderSubscription?.unsubscribe();
  }

}
