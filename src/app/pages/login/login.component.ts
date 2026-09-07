import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DividerModule } from 'primeng/divider';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  imports: [ButtonModule, InputTextModule,  CardModule, PasswordModule, FloatLabelModule,DividerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  constructor(private router: Router){}

  onSubmitTimecardClicked(){
    this.router.navigate(['timecard-submission'])
  }

  onViewTimecardsClicked(){
    this.router.navigate(['view-timecard'])
  }

  onAttendanceClicked(){
    this.router.navigate(['attendance-entry'])
  }

}
