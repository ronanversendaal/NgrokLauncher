import { Component } from '@angular/core';
import { NavController, NavParams, Events  } from 'ionic-angular';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Http } from '@angular/http';

@Component({
  selector: 'page-list',
  templateUrl: 'list.html',
  providers : [
    InAppBrowser
  ]
})
export class ListPage {
  selectedItem: any;
  icons: string[];
  items: Array<{url: string, date: string}>;
  messages: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, private iab: InAppBrowser, public http: Http, public events: Events) {
    // If we navigated to this page, we will have an item available as a nav param
    this.selectedItem = navParams.get('item');
    this.http = http;
    this.iab = iab;

    this.messages = {
            success : '',
            error : ''
        };

    this.items = [];
    for (let i = 1; i < 11; i++) {
      this.items.push({
        url: this.stringGen(6),
        date: this.randomDate(new Date(2017, 10, 22), new Date()).toLocaleString()
      });
    }

    events.subscribe('ngrok:launch', (ngrok_url) => {
        // Fire the inAppBrowser via an event so we can still access the this object after checking the url. 
        this.iab.create(ngrok_url, "_system", "location=true");
    });
  }

  stringGen(len)
  {
      var text = " ";
      
      var charset = "abcdefghijklmnopqrstuvwxyz0123456789";
      
      for( var i=0; i < len; i++ )
          text += charset.charAt(Math.floor(Math.random() * charset.length));
      
      return text;
  }

  randomDate(start, end) {
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  itemTapped(event, item) {
    this.launch(item.url)
  }

  setErrorMessage(message){
      this.messages.success = '';
      this.messages.error = message;

      setTimeout(()=>{
          this.messages.error = '';
      },3000);   
  }

  setSuccessMessage(message){

      this.messages.error = '';
      this.messages.success = message;

      setTimeout(()=>{
          this.messages.success = '';
      },3000);   
  }

  launch(url) {

      let ngrok_url = 'https://'+url;

      this.http.get(ngrok_url).map(data =>{
          if(data.ok){
              // Fire of an event so we can launch the browser
              this.events.publish('ngrok:launch', ngrok_url);
          }
      }).subscribe(data => {}, err => {
          if(err.status === 0){
              this.setErrorMessage('Ngrok domain unreachable. Are you on WiFi?');
          } else if(err.status === 404){
              this.setErrorMessage('Ngrok domain unreachable. Please check the code and try again.');
          }
      });

    }
}
