import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import * as EtoanActions from '../actions/etoan-actions';
import { EtoanHttpService } from '../../services/etoan-http-service.service';

@Injectable()
export class EtoanEffects {
private actions$ = inject(Actions);
private etoanHttpService = inject(EtoanHttpService);
 

  getEmployeeDetails$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EtoanActions.getEmployeeDetails),
      switchMap(() =>
        this.etoanHttpService.fetchEmployeeDetails().pipe(
          map(({ data, error }) => {
            if (error) {
              return EtoanActions.apiFailure({
                concern: 'getEmployeeDetails',
                error
              });
            }

            return EtoanActions.getEmployeeDetailsSuccess({
              employeeDetails: data ?? []
            });
          }),
          catchError((error) =>
            of(
              EtoanActions.apiFailure({
                concern: 'getEmployeeDetails',
                error
              })
            )
          )
        )
      )
    )
  );

  getProjectSites$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EtoanActions.getProjectSites),
      switchMap(() =>
        this.etoanHttpService.fetchProjectSites().pipe(
          map(({ data, error }) => {
            if (error) {
              return EtoanActions.apiFailure({
                concern: 'getProjectSites',
                error
              });
            }

            return EtoanActions.getProjectSitesSuccess({
              projectSites: data ?? []
            });
          }),
          catchError((error) =>
            of(
              EtoanActions.apiFailure({
                concern: 'getProjectSites',
                error
              })
            )
          )
        )
      )
    )
  );
}