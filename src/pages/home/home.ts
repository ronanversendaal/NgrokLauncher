import { Component } from '@angular/core';
import { Platform, NavController, Events } from 'ionic-angular';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Http } from '@angular/http';
import { Network } from '@ionic-native/network';

import 'rxjs/add/operator/map';
import { ToastController } from 'ionic-angular';


import { Storage } from '@ionic/storage';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers : [
    InAppBrowser,
    Network
  ]
})

export class HomePage {

    public url: string;
    public ngrok_url : string;
    public recents : Array<{url: string, date: string, active : boolean, fav : boolean}>;
    public active : any;

    constructor(
        public navCtrl: NavController, 
        public platform: Platform, 
        private iab: InAppBrowser, 
        public http: Http, 
        public events: Events,
        public toastCtrl: ToastController,
        private storage: Storage,
        private network: Network) {

        this.platform = platform;
        this.http = http;
        this.iab = iab;
        this.storage = storage;
        this.recents = [];

        this.network.onConnect().subscribe(() => {
          // We just got a connection but we need to wait briefly
           // before we determine the connection type. Might need to wait.
          // prior to doing any api requests as well.
          setTimeout(() => {
            if (this.network.type !== 'wifi') {
                 this.presentToast('No WiFi connection detected. Unable to launch ngrok.io domains.'); 
            }
          }, 3000);
        });

        storage.get('recents').then((recents) => {
            if(!recents){
                recents = [];
            }
                // recents = _.sortBy(recents, function(o) { return moment(o.date); }).reverse();

                for (const {domain, index} of recents.map((domain, index) => ({domain, index}))) {

                    this.recents.push({
                        url: domain.url,
                        date: domain.date,
                        active : false,
                        fav : domain.fav
                    });

                    this.pingUrl(domain.url).finally(() => {
                        this.recents[index].active = this.active;
                    }).subscribe(active => {
                        this.active = active;
                    }, err => {
                        this.active = err.ok;
                    });
                }
        });
        

        events.subscribe('ngrok:launch', (ngrok_url, url) => {
            // Fire the inAppBrowser via an event so we can still access the this object after checking the url. 
            this.presentToast('Launching..');
            this.addToRecents(url).then((recents) => {
                this.iab.create(ngrok_url, "_system", "location=true");    
            });
            
        });

        events.subscribe('subdomains:unfav', (index) => {

            var removed = this.recents.filter(item => item.url !== index.url);
            var search = this.recents.find(item => item.url === index.url);

            search.fav = false;
            removed.push(search);

            this.recents = removed;

            this.storage.set('recents', removed);
        })


    }


    launch(url) {

        // this.url = url;

        this.platform.ready().then(() => {

            if(this.network.type !== 'wifi'){
                this.presentToast('No WiFi connection detected. Unable to launch ngrok.io domains.');
                return false;
            }

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


  pingUrl(url){
      let ngrok_url = 'https://'+url+'.ngrok.io';

      return this.http.get(ngrok_url).map(active => active.ok);
  }

  addToRecents(url){
      
      let remove = this.recents.filter(recent => (recent.url.toLowerCase() === url.toLowerCase()));
      let fav = false;

      if(remove[0]){
          fav = remove[0].fav
      }

      this.recents = this.recents.filter(recent => remove.indexOf(recent) < 0);
      this.recents.unshift({url : url, date :  new Date().toLocaleString(), active : true, fav : fav});

      // @todo 10 should be some setting/constant
      // Removes the last recent if limit exceeded.
      if(this.recents.length > 10){
          this.recents.pop();
      }

      return this.storage.set('recents', this.recents);
  }

  toggleSubdomains(item, index){

      this.recents[index].fav = !this.recents[index].fav;
      this.storage.set('recents', this.recents);

      this.storage.get('subdomains').then((subdomains) => {
          if(!subdomains){
              subdomains = [];
          }

          let remove = subdomains.filter(domain => (domain.url.toLowerCase() === item.url.toLowerCase()));
          subdomains = subdomains.filter(domain => remove.indexOf(domain) < 0);

          item.fav = this.recents[index].fav;
          item.active = true;

          let domain = item;

          // Only add the new domain if it has fav = true
          if(item.fav){
              subdomains.unshift(domain);    
          }
          return this.storage.set('subdomains', subdomains);
      });
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
