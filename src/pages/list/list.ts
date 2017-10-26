import { Component } from '@angular/core';
import { NavController, NavParams, Events  } from 'ionic-angular';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Http } from '@angular/http';
import { Storage } from '@ionic/storage';
import { ToastController } from 'ionic-angular';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/finally';
import moment from 'moment';
import _ from 'lodash';
import { AlertController } from 'ionic-angular';
import { Network } from '@ionic-native/network';

@Component({
  selector: 'page-list',
  templateUrl: 'list.html',
  providers : [
    InAppBrowser,
    Network
  ]
})
export class ListPage {
  selectedItem: any;
  icons: string[];
  subdomains: Array<{url: string, date: string, active : boolean, fav : boolean}>;
  messages: any;
  active : any;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams, 
    private iab: InAppBrowser, 
    public http: Http, 
    public events: Events,
    public toastCtrl: ToastController,
    private storage: Storage,
    public alertCtrl: AlertController,
    private network: Network) {
    // If we navigated to this page, we will have an item available as a nav param
    this.selectedItem = navParams.get('item');
    this.http = http;
    this.iab = iab;

    this.messages = {
        success : '',
        error : ''
    };

    this.subdomains = [];

    storage.get('subdomains').then((subdomains) => {
        if(!subdomains){
          subdomains = [];
          this.presentToast('No saved subdomains. Add some by pressing the star button on recent entries in the Launcher.', null, 'bottom', true);
        }

        subdomains = _.sortBy(subdomains, function(o) { return moment(o.date); }).reverse();

        for (const {domain, index} of subdomains.map((domain, index) => ({domain, index}))) {
            this.subdomains.push({
                url: domain.url,
                date: domain.date,
                active : false,
                fav : true,
            });

            this.pingUrl(domain.url).finally(() => {
                this.subdomains[index].active = this.active;
            }).subscribe(active => {
                this.active = active;
            }, err => {
                this.active = err.ok;
            });
        }
    });

    events.subscribe('ngrok:launch', (ngrok_url) => {
        // Fire the inAppBrowser via an event so we can still access the this object after checking the url. 
        this.iab.create(ngrok_url, "_system", "location=true");
    });

  }

  pingUrl(url){
      let ngrok_url = 'https://'+url+'.ngrok.io';

      return this.http.get(ngrok_url).map(active => active.ok);
  }

  removeSubdomain(item, index){

    let data = {
      item , index
    }
    
    this.subdomains = this.subdomains.filter(item => data.item.url != item.url);
    this.events.publish('subdomains:unfav', data.item);

    return this.storage.set('subdomains', this.subdomains);
  }

  launch(url) {

        // this.url = url;

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
    }

  itemTapped(event, item) {

      this.launch(item.url);
    }


    presentToast(message, duration = 3000, position = 'bottom', confirm = false) {
      const toast = this.toastCtrl.create({
        message: message,
        duration: duration,
        position: position,
        dismissOnPageChange : true,
        showCloseButton : confirm
      });

      toast.onDidDismiss(() => {
      });

      toast.present();
    }
}
