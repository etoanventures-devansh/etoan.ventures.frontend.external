import { createReducer, on } from "@ngrx/store";
import * as EtoanActions from '../actions/etoan-actions';
import { EtoanIntialState } from "../../models/etoan-models";

const EtoanInitialState: EtoanIntialState = {
    loading: false,
    error: null,
    projectSites: null,
    employeeDetails: null,
    previousTimecards: null
}

export const etoanReducer = createReducer(EtoanInitialState,
    on(EtoanActions.getEmployeeDetails, (state)=> ({
        ...state,
        loading: true,
        error: null
    })),
    on(EtoanActions.getEmployeeDetailsSuccess, (state, action) => ({
        ...state, 
        employeeDetails: action.employeeDetails, 
        loading: false
    })),
    on(EtoanActions.getProjectSites, (state)=> ({
        ...state,
        loading: true,
        error: null
    })),
    on(EtoanActions.getProjectSitesSuccess, (state, action) => ({
        ...state, 
        projectSites: action.projectSites, 
        loading: false
    })),
    on(EtoanActions.getPreviousTimecards, (state)=> ({
        ...state,
        loading: true,
        error: null
    })),
     on(EtoanActions.getPreviousTimecardsSuccess, (state, action)=> ({
        ...state,
        loading: false,
        error: null,
        previousTimecards: action.timecards
    })),
    on(EtoanActions.apiFailure, (state, action) => ({
        ...state, 
        loading: false,
        error: {concern: action.concern, error: action.error}
    }))
 )