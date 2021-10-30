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

  loading = true;
  error: any;
  nom:string="Not loaded";
  data:any;

  constructor(public service: GraphqlService) {}

  ngOnInit():void {
    this.getBioSubscription = this.service.getProfileData().valueChanges.subscribe(result=>
      {
        this.data = result.data;
        console.log(this.data.user)
      }
    );
  }

}
