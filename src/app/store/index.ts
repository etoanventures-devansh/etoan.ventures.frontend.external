import { createFeatureSelector, createSelector } from '@ngrx/store';
import { EtoanIntialState } from '../models/etoan-models';

export const selectEtoanState =
  createFeatureSelector<EtoanIntialState>('etoanReducer');

export const employeeDetails = createSelector(selectEtoanState, (state)=> state.employeeDetails);
export const projectSites = createSelector(selectEtoanState, (state)=>state.projectSites);
export const previousTimecards = createSelector(selectEtoanState, (state)=>state.previousTimecards);
export const employeeSalaryRate = createSelector(selectEtoanState, (state) => state.employeeSalaryRate);
export const employeeSalaryRecords = createSelector(selectEtoanState, (state) => state.employeeSalaryRecords);
export const loading = createSelector(selectEtoanState, (state)=>state.loading);
export const failure = createSelector(selectEtoanState, (state)=>state.error);