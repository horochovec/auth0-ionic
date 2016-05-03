import {App, Platform} from 'ionic-angular';
import {StatusBar} from 'ionic-native';
import {PerfilPage} from './pages/perfil/perfil';
import {provide} from 'angular2/core';
import {Http} from 'angular2/http';
import {AuthHttp, AuthConfig} from 'angular2-jwt';
import {AuthService} from './services/authservice';

@App({
  template: '<ion-nav [root]="rootPage"></ion-nav>',
  config: {},
  providers: [
    provide(AuthHttp, {
      useFactory: (http) => {
        return new AuthHttp(new AuthConfig(), http);
      },
      deps: [Http]
    }), AuthService]
})
export class TodoApp {
  rootPage: any = PerfilPage;

  constructor(platform: Platform, private authHttp: AuthHttp, private auth: AuthService) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      this.auth.startupTokenRefresh();
    });
  }
}
