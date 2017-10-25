import { Component } from '@angular/core';
import { Platform, NavController, Events } from 'ionic-angular';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { ToastController } from 'ionic-angular';
import moment from 'moment';
import _ from 'lodash';

import { Storage } from '@ionic/storage';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers : [
    InAppBrowser
  ]
})

export class HomePage {

    public url: string;
    public ngrok_url : string;
    public recents : Array<{url: string, date: string}>;

    constructor(
        public navCtrl: NavController, 
        public platform: Platform, 
        private iab: InAppBrowser, 
        public http: Http, 
        public events: Events,
        public toastCtrl: ToastController,
        private storage: Storage) {

        this.platform = platform;
        this.http = http;
        this.iab = iab;
        this.storage = storage;
        this.recents = [];
        

        // storage.set('recents', [{url: 'dejdei', date : '2017-10-24 12:41' }, {url : 'oakwddw', date : '2017-10-24 12:41'},{url: 'dejsddei', date : '2017-10-24 12:41' }, {url : 'oakwfdsddw', date : '2017-10-24 12:41'},{url: 'defjdei', date : '2017-10-24 12:41' }, {url : 'oakwdfdw', date : '2017-10-24 12:41'},{url: 'dfejdei', date : '2017-10-24 12:41' }, {url : 'oakwdfdw', date : '2017-10-24 12:41'}]);
        // storage.clear();

        storage.get('recents').then((recents) => {
            console.log('get', recents);
            if(recents){
                this.recents = recents;
            }
        });
        

        events.subscribe('ngrok:launch', (ngrok_url, url) => {
            // Fire the inAppBrowser via an event so we can still access the this object after checking the url. 
            this.presentToast('Launching..');
            this.addToRecents(url).then((recents) => {
                this.iab.create(ngrok_url, "_system", "location=true");    
            });
            
        });


    }


    launch(url) {

        // this.url = url;

        this.platform.ready().then(() => {

            let ngrok_url = 'https://'+url+'.ngrok.io';

            this.http.get(ngrok_url).map(data =>{
                if(data.ok){
                    // Fire of an event so we can launch the browser
                    this.events.publish('ngrok:launch', ngrok_url, url);
                }
            }).subscribe(data => {}, err => {
                if(err.status === 0){
                    this.presentToast('Ngrok domain invalid or unreachable. Please enter a valid ngrok.io subdomain.', 4000);
                } else if(err.status === 404){
                    this.presentToast('Ngrok domain unreachable. Please check the code and try again.', 4000);
                }
            });

        });
    }


  itemTapped(event, item) {

    this.launch(item.url);
  }

  addToRecents(url){

      this.recents = _.sortBy(this.recents, function(o) { return moment(o.date); }).reverse();

      let remove = this.recents.filter(recent => (recent.url.toLowerCase() === url.toLowerCase()));
      this.recents = this.recents.filter(recent => remove.indexOf(recent) < 0);

      this.recents.unshift({url : url, date :  new Date().toLocaleString()});

      // @todo 10 should be some setting/constant
      // Removes the last recent if limit exceeded.
      console.log(this.recents.length)
      if(this.recents.length > 10){
          this.recents.pop();
      console.log(this.recents.length)
      }



    return this.storage.set('recents', this.recents);
  }

    presentToast(message, duration = 3000, position = 'bottom') {
      const toast = this.toastCtrl.create({
        message: message,
        duration: duration,
        position: position,
        dismissOnPageChange : true,
      });

      toast.onDidDismiss(() => {
      });

      toast.present();
    }

}
