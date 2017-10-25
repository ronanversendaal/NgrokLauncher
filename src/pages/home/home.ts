import { Component } from '@angular/core';
import { Platform, NavController, Events } from 'ionic-angular';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { ToastController } from 'ionic-angular';
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

    constructor(public navCtrl: NavController, public platform: Platform, private iab: InAppBrowser, public http: Http, public events: Events,public toastCtrl: ToastController) {
        this.platform = platform;
        this.http = http;
        this.iab = iab;

        events.subscribe('ngrok:launch', (ngrok_url) => {
            // Fire the inAppBrowser via an event so we can still access the this object after checking the url. 
            this.iab.create(ngrok_url, "_system", "location=true");
        });
    }



    launch(url) {

        this.url = url;

        this.platform.ready().then(() => {

            let ngrok_url = 'https://'+this.url+'.ngrok.io';

            this.http.get(ngrok_url).map(data =>{
                if(data.ok){
                    // Fire of an event so we can launch the browser
                    this.presentToast('Launching..');
                    this.events.publish('ngrok:launch', ngrok_url);
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
