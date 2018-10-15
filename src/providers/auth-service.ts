import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import 'rxjs/add/operator/map';

//SERVER URL

//localhost
let apiUrl = "http://localhost/PHP-Slim-Restful/api/";

//HK-URL
//let apiUrl = 'http://074e541f.ngrok.io/PHP-Slim-Restful/api/';

//DH-URL
//let apiUrl = 'http://5d187040.ngrok.io/PHP-Slim-Restful/api/';


/*
  Generated class for the AuthService provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class AuthService {

  constructor(public http: Http) {
    console.log('Hello AuthService Provider');
  }

  postData(credentials, type) {

    return new Promise((resolve, reject) => {
      let headers = new Headers();
      this.http.post(apiUrl + type, JSON.stringify(credentials), { headers: headers }).
        subscribe(res => {
          resolve(res.json());
        }, (err) => {
          reject(err);
        });

    });

  }

}
