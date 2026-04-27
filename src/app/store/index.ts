import { createFeatureSelector, createSelector } from '@ngrx/store';
import { EtoanIntialState } from '../models/etoan-models';

export const selectEtoanState =
  createFeatureSelector<EtoanIntialState>('etoanReducer');

export const employeeDetails = createSelector(selectEtoanState, (state)=> state.employeeDetails);
export const projectSites = createSelector(selectEtoanState, (state)=>state.projectSites);
export const loading = createSelector(selectEtoanState, (state)=>state.loading);
export const failure = createSelector(selectEtoanState, (state)=>state.error);