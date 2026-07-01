import { createReducer, on } from "@ngrx/store";
import * as EtoanActions from '../actions/etoan-actions';
import { EtoanIntialState } from "../../models/etoan-models";

const EtoanInitialState: EtoanIntialState = {
    loading: false,
    error: null,
    projectSites: null,
    employeeDetails: null,
    previousTimecards: null,
    employeeSalaryRate: null,
    employeeSalaryRecords: null
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
    on(EtoanActions.resetTimecards, (state)=> ({
        ...state,
         previousTimecards: null
    })),
     on(EtoanActions.getPreviousTimecardsSuccess, (state, action)=> ({
        ...state,
        loading: false,
        error: null,
        previousTimecards: action.timecards
    })),
    
    on(EtoanActions.getEmployeeSalaryRate, (state)=> ({
        ...state,
        loading: true,
        error: null,
    })),
    on(EtoanActions.getEmployeeSalaryRateSuccess, (state,action) => ({
        ...state,
        loading: false,
        error: null,
        employeeSalaryRate: action.salaryRate
    })),
     on(EtoanActions.getEmployeeSalaryRecords, (state)=> ({
        ...state,
        loading: true,
        error: null,
    })),
    on(EtoanActions.getEmployeeSalaryRecordsSuccess, (state,action) => ({
        ...state,
        loading: false,
        error: null,
        employeeSalaryRecords: action.salaryRecords
    })),

    on(EtoanActions.apiFailure, (state, action) => ({
        ...state, 
        loading: false,
        error: {concern: action.concern, error: action.error}
    })),
    on(EtoanActions.setIsLoading, (state, action) => ({
        ...state, 
        loading: action.isLoading,
        error: null
    })),
 )