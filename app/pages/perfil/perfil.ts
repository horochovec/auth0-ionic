import {Page} from 'ionic-angular';
import {AuthService} from '../../services/authservice';

@Page({
  templateUrl: 'build/pages/perfil/perfil.html',
})
export class PerfilPage {
    
    constructor(private auth: AuthService) {
        
    }
    
}