import {Storage, LocalStorage} from 'ionic-angular';
import {AuthHttp, JwtHelper, tokenNotExpired} from 'angular2-jwt';
import {Injectable, NgZone} from 'angular2/core';
import {Observable} from 'rxjs/Rx';
import {ConfigAuth0} from '../config-auth0';

declare var Auth0Lock : any;

@Injectable()
export class AuthService {

    jwtHelper: JwtHelper = new JwtHelper();
    lock = new Auth0Lock(ConfigAuth0.CLIENT_ID, ConfigAuth0.AUTH0_DOMAIN);
    local: Storage = new Storage(LocalStorage);
    refreshSubscription: any;
    user: Object;
    zoneImpl: NgZone;
  
    constructor(private authHttp: AuthHttp, zone: NgZone) {
        this.zoneImpl = zone;
        this.local.get('profile').then(profile => {
            this.user = JSON.parse(profile);
        }).catch(error => {
            console.log(error);
        });
    }
  
    public authenticated() {
        return tokenNotExpired();
    }
  
    public login() {
        this.lock.show({
            authParams: {
                scope: 'openid offline_access',
                device: 'Mobile device'
            }
        }, (err, profile, token, accessToken, state, refreshToken) => {
            if (err) {
                alert(err);
            }
            this.local.set('profile', JSON.stringify(profile));
            this.local.set('id_token', token);
            this.local.set('refresh_token', refreshToken);
            this.zoneImpl.run(() => this.user = profile);
            this.scheduleRefresh();
        });    
    }
  
    public logout() {
        this.local.remove('profile');
        this.local.remove('id_token');
        this.local.remove('refresh_token');
        this.zoneImpl.run(() => this.user = null);
        this.unscheduleRefresh();
    }
    
    public scheduleRefresh() {
      let source = this.authHttp.tokenStream.flatMap(
        token => {
          let jwtIat = this.jwtHelper.decodeToken(token).iat;
          let jwtExp = this.jwtHelper.decodeToken(token).exp;
          let iat = new Date(0);
          let exp = new Date(0);

          let delay = (exp.setUTCSeconds(jwtExp) - iat.setUTCSeconds(jwtIat));

          return Observable.interval(delay);
        });
      this.refreshSubscription = source.subscribe(() => {
      this.getNewJwt();
    });
  }

  public startupTokenRefresh() {
    if (this.authenticated()) {
      let source = this.authHttp.tokenStream.flatMap(
        token => {
          let now: number = new Date().valueOf();
          let jwtExp: number = this.jwtHelper.decodeToken(token).exp;
          let exp: Date = new Date(0);
          exp.setUTCSeconds(jwtExp);
          let delay: number = exp.valueOf() - now;
          return Observable.timer(delay);
        });
        source.subscribe(() => {
          this.getNewJwt();
          this.scheduleRefresh();
        });
    }
  }

  public unscheduleRefresh() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  public getNewJwt() {
    this.local.get('refresh_token').then(token => {
      this.lock.getClient().refreshToken(token, (err, delegationRequest) => {
        if (err) {
          alert(err);
        }
        this.local.set('id_token', delegationRequest.id_token);
      });
    }).catch(error => {
      console.log(error);
    });
  }
  
}    