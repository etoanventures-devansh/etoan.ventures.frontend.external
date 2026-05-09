import {createAction, props} from '@ngrx/store';
import { SupabaseResponse,EmployeeDetails, ProjectSites, API_FAILURE_TYPES, PreviousTimecards } from '../../models/etoan-models';

export const getEmployeeDetails = createAction('[Employee Details] getEmployeeDetails');
export const getEmployeeDetailsSuccess = createAction('[Employee Details] getEmployeeDetailsSuccess', props<{employeeDetails: EmployeeDetails[]}>());
export const getProjectSites = createAction('[Project Sites] getProjectSites');
export const getProjectSitesSuccess = createAction('[Project Sites] getProjectSitesSuccess', props<{projectSites: ProjectSites[]}>());
export const getPreviousTimecards = createAction('[Timecards] getPreviousTimecards', props<{entityId: string}>())
export const getPreviousTimecardsSuccess = createAction('[Timecards] getPreviousTimecardsSuccess', props<{timecards: PreviousTimecards[]}>())
export const resetTimecards = createAction('[Timecards] resetTimecards');
export const setIsLoading = createAction('[Loading] setIsLoading', props<{isLoading: boolean}>())
export const apiFailure = createAction('[Failure] apiFailure', props<{concern: API_FAILURE_TYPES, error: any }>());
