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
  userName: string = "Not loaded";
  dataUser: any | undefined = { repositories: "null" , following:0,followers:0};
  dataCompany: any | undefined = { organization: "null" };
  userLogin: string = "Majdi";
  totalCommits: number = 0;
  lines:number=0
  
  repositoresTraceList = new ObservableArray<any>();

  repositoriesList =  new ObservableArray<Repository>();

  codeTypeList =  new ObservableArray<any>();

  constructor(public service: GraphqlService) { }

  ngOnInit(): void {

    this.repositoriesList.subscribe();

    this.repositoresTraceList.subscribe();

    // Info relatives au compte

    this.getBioSubscription = this.service.getProfileData(this.userLogin).valueChanges.subscribe(result => {
      this.dataUser = result.data;
      this.dataUser = this.dataUser.user;
      if (this.dataUser.company) {
        this.getCompanySubscription = this.service.getCompanyData(this.userLogin, this.dataUser.company).valueChanges.subscribe(resultCompany => {
          this.dataCompany = resultCompany.data;
          this.dataCompany = this.dataCompany.user;
        });
      }

      // Noms des repository

      let repositories: any | undefined;
      this.getRepositoriesSubscription = this.service.getRepositories(this.userLogin, this.dataUser.repositories.totalCount).valueChanges.subscribe(resultRepositories => {
        repositories = resultRepositories.data;
        repositories = repositories.user.repositories.nodes;
        repositories.forEach((repository: any) => {

          // Total de commits par repository

          const repositoryTrace = {name:repository.name,isPrivate:repository.isPrivate,owner:repository.owner.login}

          this.repositoresTraceList.push(repositoryTrace)
          
        });

          // Sources du repository    
          this.repositoresTraceList.forEach(repos => {
            if (repos.owner.toLowerCase() == this.userLogin.toLowerCase())
            {
              if(!repos.isPrivate)
              {
                let commits: any | undefined;

                this.getCommitsSubscription = this.service.getCommits(this.userLogin, repos.name).valueChanges.subscribe(numberCommits => {
                  commits = numberCommits.data;
                  commits = commits.repository.defaultBranchRef.target.history
                  this.totalCommits += commits.totalCount
                });
                
                const pathList = new ObservableArray<string>();

                const filePathList =  new ObservableArray<string>();

                const fileList = new ObservableArray<any>();

                pathList.subscribe();
          
                filePathList.subscribe();
          
                fileList.subscribe();
          
                this.getMainFolderSources(repos.name,pathList,filePathList,fileList)
          
                this.repositoriesList.push({name:repos.name, srcList:filePathList, fileList:fileList})
              }
            }      
          }) 
      });
    });
  }

  

  getFilesData(repositoryName: string, path: string, fileList:ObservableArray<any>) {
    this.getFilesDataSubscription = this.service.getFileData(this.userLogin, repositoryName, path).valueChanges.subscribe((file: any) => {
      const currentFile = file.data.repository.object
      let currentFileLines = 0
      let fileSize = 0
      const fileSrc = path.split("/")
      const nameFile = fileSrc[fileSrc.length-1]
      const typeFile = nameFile.split(".")[nameFile.split(".").length-1]
      if(currentFile.text)
      {
        fileSize = currentFile.byteSize
        
        currentFileLines = currentFile.text.split("\r\n").length + currentFile.text.split("\n\n").length
        
        let typeIsNew = true
        let existingTypCodeLocationCounter = 0
        let existingTypCodeLocation:number
        this.codeTypeList.forEach(typeCode => {
          console.log("typeCheck : " + typeCode.type,"maybeNewType : "+typeFile)
          console.log(typeCode.type == typeFile)
          if (typeCode.type == typeFile)
          {
            typeIsNew = false
            existingTypCodeLocation = existingTypCodeLocationCounter
          }
          existingTypCodeLocationCounter +=1
        });

        if(typeIsNew)
        {
          const newCodeType = {type:typeFile,bytes:fileSize}
          this.codeTypeList.push(newCodeType)
        }
        else{
          console.log(existingTypCodeLocationCounter)
          console.log(typeFile)
          //console.log(this.codeTypeList[existingTypCodeLocation-1])
          this.codeTypeList[existingTypCodeLocationCounter-1].bytes+=fileSize
        }
        //faire en sorte d'incrémenter la mémoire d'un langage déjà existant
        
      }
      this.lines += currentFileLines
      const fileData = {name:nameFile,pathFile:path,size:fileSize,text:currentFile.text,lines:currentFileLines}
      fileList.push(fileData)
    })
  }

  getMainFolderSources(repositoryName:string,pathList:ObservableArray<string>,filePathList:ObservableArray<string>,fileList:ObservableArray<any>){
    
    this.getMainFolderSubscription = this.service.getMainRepositoryFolder(this.userLogin, repositoryName).valueChanges.subscribe((repository:any) =>{
      pathList.push("")
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

  isType(file:any,type:string) {
    return file.type === type;
  }

  getAllFolderSources(repositoryName:string,pathList:ObservableArray<string>,filePathList:ObservableArray<string>,fileList:ObservableArray<Repository>):any {
    pathList.forEach(path=>{
      this.getAllRepositoryFolder = this.service.getAllRepositoryFolder(this.userLogin,repositoryName,path).valueChanges.subscribe((subfolder:any)=>{
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
