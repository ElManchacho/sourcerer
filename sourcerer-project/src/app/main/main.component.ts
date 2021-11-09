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

  private foldersSubscribtions: [Subscription?] = []

  private getFolderSubscription: Subscription | undefined;


  loading = true;
  nom: string = "Not loaded";
  dataUser: any | undefined = { repositories: "null" };
  dataCompany: any | undefined = { organization: "null" };
  userName: string = "Majdi";
  totalCommits: number = 0;
  repositoryToExplore: [any?] = []

  constructor(public service: GraphqlService) { }

  ngOnInit(): void {
    this.getBioSubscription = this.service.getProfileData(this.userName).valueChanges.subscribe(result => {
      this.dataUser = result.data;
      this.dataUser = this.dataUser.user;
      if (this.dataUser.company) {
        this.getCompanySubscription = this.service.getCompanyData(this.userName, this.dataUser.company).valueChanges.subscribe(resultCompany => {
          this.dataCompany = resultCompany.data;
          this.dataCompany = this.dataCompany.user;
        });
      }
      var repositories: any | undefined;
      this.getRepositoriesSubscription = this.service.getRepositories(this.userName, this.dataUser.repositories.totalCount).valueChanges.subscribe(resultRepositories => {
        repositories = resultRepositories.data;
        repositories = repositories.user.repositories.nodes;
        repositories.forEach((repository: any) => {

          // Total de commits
          var commits: any | undefined;
          this.getCommitsSubscription = this.service.getCommits(this.userName, repository.name).valueChanges.subscribe(numberCommits => {
            commits = numberCommits.data;
            commits = commits.repository.defaultBranchRef.target.history
            this.totalCommits += commits.totalCount
          });

          this.foldersSubscribtions = []

          let repositoryName = repository.name

          let folderName = ""

          this.getFolderSubscription = this.mainFolderSubscribtion(this.userName, repositoryName, folderName).subscribe(folder => {
            console.log(folder.data)
            let repositories: any = folder.data;
            let exploredFolder: any = this.separateFoldersFromFiles(repositories.repository.object.entries);
            let filesData = this.getFileData(exploredFolder.fileList);
            let folderData = this.getFolderData(exploredFolder.folderList);
            let repository = { name: repositoryName, folderList: folderData, fileList: filesData }
            let stillFolders: boolean = this.addRepository(repository)
            let counter = 0
            for (let i = 0; i < 2; i++) {
              this.repositoryToExplore.forEach(repos => {
                if (repos.name == repository.name) {
                  repos.folderList.forEach((folderNewName: string) => {
                    this.getFolderSubscription = this.mainFolderSubscribtion(this.userName, repositoryName, folderNewName + "/").subscribe(folder => {
                      repositories = folder.data;
                      exploredFolder = this.separateFoldersFromFiles(repositories.repository.object.entries);
                      filesData = this.getFileData(exploredFolder.fileList);
                      folderData = this.getFolderData(exploredFolder.folderList);
                      repository = { name: repositoryName, folderList: folderData, fileList: filesData }
                      stillFolders = this.addRepository(repository)
                    });
                  });
                }
              });
            }
          });
        });
      });
    }
    );
  }

  mainFolderSubscribtion(userName: string, repositoryName: string, folderName: string) {
    return this.service.getSpecificRepository(userName, repositoryName, folderName).valueChanges
  }

  addRepository(repositoryData: any): boolean {
    let thereAreMoreFoldersToExplore = false
    if (this.repositoryToExplore.length == 0) {
      this.repositoryToExplore.push(repositoryData);
    }
    else {
      let isIn: boolean = false
      this.repositoryToExplore.forEach(repos => {
        if (repos.name == repositoryData.name) {
          isIn = true
          repositoryData.fileList.forEach((fileToAdd: any) => {
            let addable : boolean = true
            repos.fileList.forEach((existingFile: any) => {
              if(fileToAdd.name == existingFile.name)
              {
                addable = false
              }
            });
            if(addable)
            {
              repos.fileList.push(fileToAdd)
            }
          });
          
          if (repos.folderList.length != 0) {
            let newFolderlist: string[] = []
            if (repositoryData.folderList.length != 0) {
              repositoryData.folderList.forEach((folderToAdd: string) => {
                repos.folderList.forEach((existingFolder: string) => {
                  let newPath = existingFolder + "/" + folderToAdd
                  if(!existingFolder.includes(folderToAdd))
                  {
                    newFolderlist.push(newPath)
                  }
                });
              });
              repos.folderList = repos.folderList.concat(newFolderlist)
            }
            else {
              repos.folderList = repos.folderList.concat(repositoryData.folderList)
            }
          }
          else {
            repos.folderList = repos.folderList.concat(repositoryData.folderList)
          }
        }
      });
      if (!isIn) {
        this.repositoryToExplore.push(repositoryData);
      }

    }

    return thereAreMoreFoldersToExplore
  }


  getFileData(fileList: any): any {
    let fileTampon: [any?] = []
    fileList.forEach((file: any) => {
      fileTampon.push(this.intoFile(file))
    });
    return fileTampon;
  }

  getFolderData(folderList: [any?]): [any?] {
    let folderTampon: [any?] = []
    folderList.forEach(folder => {
      folderTampon.push(this.intoFolder(folder))
    });
    return folderTampon;
  }

  separateFoldersFromFiles(folder: any) {
    let fileListed: [any?] = []
    let folderListed: [any?] = []
    folder.forEach((element: any) => {
      if (element.type == "blob") {
        if (fileListed.length == 0) {
          fileListed = []
        }
        fileListed.push(element)
      }
      else if (element.type == "tree") {
        if (folderListed.length == 0) {
          folderListed = []
        }
        folderListed.push(element)
      }
    });
    return { fileList: fileListed, folderList: folderListed };
  }

  intoFile(file: any) {
    let textToParse: string
    let typeToParse: string = file.name
    if (!file.object.text) {
      textToParse = ""
    }
    else {
      textToParse = file.object.text
    }
    let typeTampon = typeToParse.split(".")
    return { name: file.name, type: typeTampon[typeTampon.length - 1], size: file.object.byteSize, lines: textToParse.split("\r\n").length-1 };
  }

  intoFolder(folder: any) {
    return folder.name
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
