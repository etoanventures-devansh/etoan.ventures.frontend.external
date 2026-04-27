import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseClientService {
  client: SupabaseClient = createClient(environment.SUPABASE_PROJECT_URL, environment.SUPABASE_API_KEY)

  constructor() { }
}
