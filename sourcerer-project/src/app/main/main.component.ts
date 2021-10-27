import { Component, OnInit } from '@angular/core';
import {Apollo, gql} from 'apollo-angular';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
})


export class MainComponent implements OnInit {
  bio:  string | undefined;
  loading = true;
  error: any;

  constructor(private apollo: Apollo) {}

  ngOnInit() {
    this.apollo
      .watchQuery({
        query: gql`
        {
          user(login: "Majdi") {
            id
            bio
          }
        }        
        `,
      })
      .valueChanges.subscribe((result: any) => {
        console.log(result?.data);
        this.bio = result?.data?.user.bio;
        this.loading = result.loading;
        this.error = result.error;
      });
  }

}
