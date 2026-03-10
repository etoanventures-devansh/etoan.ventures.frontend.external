import { Injectable, inject } from '@angular/core';
import { createClient,SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  client: SupabaseClient = createClient(environment.SUPABASE_PROJECT_URL, environment.SUPABASE_API_KEY)


  registerUser(email: string, password:string){
    this.client.auth.signUp({email: email, password: password})
  }
}
