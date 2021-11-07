import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { GraphqlService } from '../service/graphql.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
})


export class MainComponent implements OnInit {

  private getBioSubscription:Subscription | undefined;

  private getCompanySubscription:Subscription | undefined;

  private getRepositoriesSubscription:Subscription | undefined;

  private getCommitsSubscription:Subscription | undefined;

  private getSpecificRepositorySubscription:Subscription | undefined;


  loading = true;
  nom:string="Not loaded";
  dataUser:any | undefined = {repositories:"null"};
  dataCompany:any | undefined = {organization:"null"};
  userName:string="Majdi";
  totalCommits:number=0;
  repositories:any|undefined;

  constructor(public service: GraphqlService) {}

  ngOnInit():void {
    this.getBioSubscription = this.service.getProfileData(this.userName).valueChanges.subscribe(result=>
      {
        this.dataUser = result.data;
        this.dataUser = this.dataUser.user;
        this.getCompanySubscription = this.service.getCompanyData(this.userName,this.dataUser.company).valueChanges.subscribe(resultCompany=>{
          this.dataCompany = resultCompany.data;
          this.dataCompany = this.dataCompany.user;
          var repositories:any | undefined;
          this.getRepositoriesSubscription = this.service.getRepositories(this.userName,this.dataUser.repositories.totalCount).valueChanges.subscribe(resultRepositories=>{
            repositories=resultRepositories.data;
            repositories = repositories.user.repositories.nodes;
            repositories.forEach((repository:any) => {              
              var commits:any | undefined;
              this.getCommitsSubscription = this.service.getCommits(this.userName,repository.name).valueChanges.subscribe(numberCommits=>{
                commits = numberCommits.data;
                commits = commits.repository.defaultBranchRef.target.history
                this.totalCommits += commits.totalCount
              });
              this.getSpecificRepositorySubscription = this.service.getRepository(this.userName,repository.name).valueChanges.subscribe(numberCommits=>{
                this.repositories = numberCommits.data;
                console.log(this.repositories);
              });
            });
          })
        });
      }
    );
  }

}
