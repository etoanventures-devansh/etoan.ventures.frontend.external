import { Injectable, inject } from '@angular/core';
import { createClient,SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {


  registerUser(email: string, password:string){
    // client.auth.signUp({email: email, password: password})
  }

}
