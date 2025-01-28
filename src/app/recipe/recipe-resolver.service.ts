import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from "@angular/router";
import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { Actions, ofType, rootEffectsInit } from '@ngrx/effects';

import { Recipe } from "./recipe.model";
import * as fromApp from '../store/app.reducer';
import * as RecipesAction from '../recipe/store/recipe.actions';
import { map, of, switchMap, take } from "rxjs";

@Injectable({ providedIn: "root" })
export class RecipeResolverService implements Resolve<Recipe[]> {
    constructor(private store: Store<fromApp.AppState>, private actions$: Actions) {}

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        // const recipes = this.recipesService.getRecipes();
        
        return this.store.select('recipes').pipe(
            take(1),
            map(recipesState => {
                return recipesState.recipes;
            }),
            switchMap(recipes => {
                if(recipes.length == 0) { 
                    this.store.dispatch(new RecipesAction.FetchRecipes());
                    return this.actions$.pipe(
                        ofType(RecipesAction.SET_RECIPES),
                        take(1)
                    );
                } else {
                    return of(recipes);
                }
            })
        )

    }   

}