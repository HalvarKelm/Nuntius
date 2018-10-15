import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, ToastController, App } from 'ionic-angular';
import { AuthService } from "../../providers/auth-service";
import { StorageHandlerProvider } from '../../providers/storage-handler/storage-handler';
import { Content } from 'ionic-angular';
import { empty } from 'rxjs/Observer';
import { LocalNotifications } from '@ionic-native/local-notifications';

@Component({
    selector: 'page-details',
    templateUrl: 'details.html',
})
export class Details {
  @ViewChild('content') content: any;
  @ViewChild('scroll') scroll: any;

  item;
  item2;

  //data to be sent to the server
  msgOut: any  = { "conv": "", "message": "", "author": "" };
  userData     = { "user": "", "conv": "", "type": "" };
  userDataC = { "conv": "", "oldId": "" };

  //server response data
  resposeData: any;
  resp: any;

  //used for composing a string including conversation members in dialogue
  author: String = "";
  Convarr = [];
  conv: String;

  //message parsing lists
  rawMsg = [];
  messages = [];

  d: number = 0;
  //used by intervall functions
  id:  any = 1;
  id2: any = 1;

  //to recognize new messages
  oldId:  any;
  change: any;

  //scrolling parameters
  dimensions:    any;
  scrollPos:     number;
  scrollPos0:    number;
  ContentHeight: number;

  msgSent: Boolean;
  isGroup: Boolean;

  scrollToBottom() {
    this.content.scrollToBottom();
  }

  scrollTo(x: number,
    y: number,
    duration: number): void {
    this.content.scrollTo(x, y, duration);
  }

  contentHeight() {
    this.dimensions = this.content.getContentDimensions();
    this.ContentHeight = this.dimensions.scrollHeight;
  }

  contentTop() {
    this.dimensions = this.content.getContentDimensions() ;
  }

  constructor(public navCtrl: NavController, params: NavParams, public app: App, private authService: AuthService, private toastCtrl: ToastController, public storageH: StorageHandlerProvider, public localNotifications: LocalNotifications) {
    this.item = params.data.item;
    this.isGroup = true;
    if (this.item.type.toString() != "group") {
      this.isGroup = false;
    }
    this.displayMessages();
    this.id = setInterval(() => {
      this.displayMessages();
    }, 500);
  }


  ionViewDidEnter() {
    this.content.scrollToBottom();
    this.contentTop();
    this.scrollPos0 = this.dimensions.scrollHeight - this.dimensions.scrollTop + 1000;

    this.id2 = setInterval(() => {
      this.contentTop();
      this.scrollPos = this.dimensions.scrollHeight - this.dimensions.scrollTop;
      this.contentHeight();
    }, 500);
  }

  ionViewWillLeave() {
    clearInterval(this.id);
  }

  displayMessages() {
    this.userData.user = "";

    if (!this.isGroup) {
      this.getConv();
    }

    else {
      this.userData.user = this.storageH.getUsername().toString();
      this.userData.conv = this.item.name.toString();
    }
      
    if (this.userData.conv) {
      //Api connections
      this.authService.postData(this.userData, "displayMessages").then((result) => {
        this.resposeData = result;
        if (this.resposeData) {
          this.resp = JSON.stringify(this.resposeData.disMes);
          this.oldId = JSON.stringify(this.resposeData.oldId);
          console.log(this.oldId);

          if (this.resp) {
            //parses incoming messages
            this.rawMsg = this.resp.split("fส้้้้´");
            this.rawMsg[0] = this.rawMsg[0].substring(1);
            this.rawMsg.pop();

            //determines whether message was sent by user or by contact
            for (this.d; this.d < this.rawMsg.length; this.d++) {
              if (this.d % 2 == 0) {
                if (this.rawMsg[this.d + 1] == this.storageH.getUsername().toString()) {
                  this.messages.push({ "message": this.rawMsg[this.d], "showown": true, "author": this.rawMsg[this.d + 1] });
                }
                else {
                  this.messages.push({ "message": this.rawMsg[this.d], "showown": false, "author": this.rawMsg[this.d + 1] });
                }
              }
            }
            //checks for new messages
            this.deltaMsg();
          }
        }
        else {
          console.log("Not found!");
        }
      }, (err) => {
        //Connection failed message
        this.presentToast("Connection failed. Error: " + err);
      });
    }
    else {
      this.presentToast("Could not load messages. Try again!");
    }
  }

  msgSend() {
    this.msgSent = true;
    if (!this.isGroup) {
      this.getConv();
      this.msgOut.conv = this.userData.conv;
    }
    else {
      this.msgOut.conv = this.item.name.toString();
    }

    this.msgOut.author = this.storageH.getUsername().toString();
    console.log("Message Out: conv=" + this.msgOut.conv + " message=" + this.msgOut.message + " author=" + this.msgOut.author);

    if (this.msgOut) {
      //Api connections
      this.authService.postData(this.msgOut, "sendMessage").then((result) => {
        this.resposeData = result;
        if (this.resposeData) {
          this.resp = JSON.stringify(this.resposeData.total);
          this.msgOut.message = "";
          console.log(this.resp);
          this.scrollToBottom();
        }
        else {
          console.log("Not found!");
        }
      }, (err) => {
        //Connection failed message
        this.presentToast("Connection failed. Error: "+err);
        });
    }
    else {
      this.presentToast("Messgage not send. Try again!");
    }
  }

  //notifies user when new message appears in chat
  deltaMsg() {
    if (this.msgSent) {
      this.msgSent = false;
    }

    else {
      this.getConv();
      this.userDataC.conv = this.userData.conv;
      this.userDataC.oldId = this.oldId;


      if (this.userDataC) {
        //Api connections
        this.authService.postData(this.userDataC, "deltaMsg").then((result) => {
          this.resposeData = result;
          if (this.resposeData) {
            this.change = JSON.stringify(this.resposeData.change);
            this.userDataC.oldId = "";
            console.log(this.change);

            if (this.change == '"1"') {
              this.notify();

              this.contentHeight();
              this.scrollTo(0, this.ContentHeight, 1);
            }
          }
          else {
            console.log("Not found!");
          }
        }, (err) => {
          //Connection failed message
          this.presentToast("Connection failed. Error: " + err);
        });
      }
      else {
        this.presentToast("Messgage not send. Try again!");
      }
    }
  }

  presentToast(msg) {
    let toast = this.toastCtrl.create({
      message: msg,
      duration: 2000
    });
    toast.present();
  }

  //composes a string including conversation members in dialogue
  getConv() {
    this.Convarr = [];
    this.author = this.storageH.getUsername();
    this.Convarr.push({ "username": this.author.toString() });
    this.Convarr.push({ "username": this.item.name.toString() });
    this.Convarr.sort(function (a, b) {
      var nameA = a.username.toLowerCase(), nameB = b.username.toLowerCase();
      if (nameA < nameB) //sort string ascending
        return -1;
      if (nameA > nameB)
        return 1;
      return 0; //default return value (no sorting)
    });


    this.userData.conv = this.Convarr[0].username + ":" + this.Convarr[1].username;
  }

  notify() {
    this.localNotifications.schedule({
      title: 'Nuntius',
      text: 'Du hast neue Nachrichten!',
      led: '0000FF',
    });
   }
}


